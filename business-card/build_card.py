#!/usr/bin/env python3
"""
Business card generator - Sophia Reddehase / One Place Locators.

Emits print-ready front/back artwork at 3.5 x 2 in with 0.125 in bleed.
The One Place Locators mark is drawn as vector geometry (measured off the
original signature artwork) so it stays crisp at press resolution.

    python3 build_card.py

Outputs land in ./out.
"""

import math
import os
import subprocess
import textwrap

from PIL import ImageFont

# ---------------------------------------------------------------- constants

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
OUT = os.path.join(HERE, "out")

DPI = 300
TRIM_W_IN, TRIM_H_IN = 3.5, 2.0
BLEED = 37.5                                                   # 0.125 in

TRIM_W, TRIM_H = int(TRIM_W_IN * DPI), int(TRIM_H_IN * DPI)    # 1050 x 600
FULL_W, FULL_H = TRIM_W + 2 * BLEED, TRIM_H + 2 * BLEED        # 1125 x 675

# Origin of the trim box inside the full (bleed) artboard.
TX, TY = BLEED, BLEED

MARGIN = 72                       # content inset from the trim edge (0.24 in)
L = TX + MARGIN                   # left content edge
R = TX + TRIM_W - MARGIN          # right content edge
T = TY + MARGIN                   # top content edge
B = TY + TRIM_H - MARGIN          # bottom content edge

FRAME_INSET = 26                  # hairline border, inset from the trim edge

# Deep navy field with a warm metallic accent. The logo keeps its own brand
# colours; they only ever appear inside the white bubble, so the two navies
# never touch.
FIELD = "#0B2447"                 # card navy
GOLD = "#C0A063"
GOLD_SOFT = "#8C7440"             # gold that still reads on ivory
IVORY = "#F4F1EA"
WHITE = "#FFFFFF"
MIST = "#C7D0E0"                  # muted cool white for secondary copy

BRAND_NAVY = "#10377B"
BRAND_GREEN = "#3EB489"
BRAND_PINK = "#FF206E"

FONTS = {
    "didot": ("/usr/share/fonts/opentype/didot/GFSDidot.otf", "GFS Didot", 400),
    "light": ("/usr/share/fonts/truetype/montserrat/Montserrat-Light.ttf",
              "Montserrat", 300),
    "regular": ("/usr/share/fonts/truetype/montserrat/Montserrat-Regular.ttf",
                "Montserrat", 400),
    "medium": ("/usr/share/fonts/truetype/montserrat/Montserrat-Medium.ttf",
               "Montserrat", 500),
    "semibold": ("/usr/share/fonts/truetype/montserrat/Montserrat-SemiBold.ttf",
                 "Montserrat", 600),
    "extrabold": ("/usr/share/fonts/truetype/montserrat/Montserrat-ExtraBold.ttf",
                  "Montserrat", 800),
}

# ---------------------------------------------------------------- content

NAME = "SOPHIA REDDEHASE"
TITLE = "LICENSED REAL ESTATE AGENT"
PHONE = "512-676-1215"
EMAIL = "sophia@oneplacelocators.com"
SITE = "oneplacelocators.com"
LICENSE = "One Place Locators  ·  TREC License #831516"

QR_URL = (
    "https://forms.zohopublic.com/oneplace731/form/OnePlaceLocatorsWorkwithusV2/"
    "formperma/TteAdf2BIOBAbltye4fWBEU_dN4R9tfbnfhSfEs-l5M"
    "?Lead_Owner_Email=sophia%40oneplacelocators.com"
)
QR_EYEBROW = "SCAN ME TO GET STARTED"
QR_LINE = "I'll be in touch ASAP"

# Printed QR modules below ~0.4 mm stop surviving ink spread on uncoated stock.
# At 175 characters this payload needs 53 modules, so the code has to be about
# an inch across - hence it lives on the back, not squeezed onto the front.
QR_MIN_MODULE_MM = 0.40


# ---------------------------------------------------------------- text metrics

# PIL only accepts integer pixel sizes, so every metric is measured once at a
# large probe size and scaled linearly. Measuring at the real size would quantise
# badly for small type.
_PROBE = 512


def _face(font):
    return ImageFont.truetype(FONTS[font][0], _PROBE)


def text_width(s, size, font, tracking=0.0):
    """Advance width of `s` at `size` px, including per-gap tracking."""
    w = _face(font).getlength(s) * size / _PROBE
    return w + tracking * max(len(s) - 1, 0)


def tracking_to_fit(s, size, font, target):
    """Letter-spacing that makes `s` render exactly `target` px wide."""
    gaps = max(len(s) - 1, 0)
    if not gaps:
        return 0.0
    return (target - text_width(s, size, font)) / gaps


def cap_height(size, font):
    bbox = _face(font).getbbox("H")
    return (bbox[3] - bbox[1]) * size / _PROBE


def size_for_cap(cap, font):
    """Font size whose cap height is `cap` px."""
    return cap * _PROBE / cap_height(_PROBE, font)


def size_to_fit(s, font, target):
    """Font size at which `s` naturally renders `target` px wide."""
    return target * _PROBE / _face(font).getlength(s)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def embedded_png(filename):
    """Inline an asset as a data URI so the SVG/PDF is self-contained."""
    import base64

    with open(os.path.join(ASSETS, filename), "rb") as fh:
        return "data:image/png;base64," + base64.b64encode(fh.read()).decode()


def text(s, x, y, size, font, fill, tracking=0.0, anchor="start"):
    family, weight = FONTS[font][1], FONTS[font][2]
    ls = f' letter-spacing="{tracking:.3f}"' if tracking else ""
    return (
        f'<text x="{x:.2f}" y="{y:.2f}" font-family="{family}" '
        f'font-weight="{weight}" font-size="{size:.2f}" fill="{fill}" '
        f'text-anchor="{anchor}"{ls} xml:space="preserve">{esc(s)}</text>'
    )


def rule(x, y, w, colour, h=1.4):
    return f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h}" fill="{colour}"/>'


# ---------------------------------------------------------------- logo mark
#
# Geometry below is expressed in the mark's own 806 x 865 design grid, measured
# from the original artwork at 16x. draw_mark() scales it to any target height.

MARK_W, MARK_H = 806.0, 865.0
_RADIUS = 184                      # bubble corner radius
_BODY_H = 760                      # bubble body height (tail hangs below)
_STROKE = 37                       # house outline weight

_BUBBLE = (
    f"M {_RADIUS} 0 H {MARK_W - _RADIUS:.0f} "
    f"A {_RADIUS} {_RADIUS} 0 0 1 {MARK_W:.0f} {_RADIUS} "
    f"V {_BODY_H - _RADIUS} "
    f"A {_RADIUS} {_RADIUS} 0 0 1 {MARK_W - _RADIUS:.0f} {_BODY_H} "
    f"H 268 L 100 855 C 60 872 0 848 0 800 "
    f"V {_RADIUS} A {_RADIUS} {_RADIUS} 0 0 1 {_RADIUS} 0 Z"
)

# One continuous stroke: left sill -> left wall -> roof peak -> right wall
# -> around the pin bowl -> up the needle.
_HOUSE = (
    "M 291 632 L 201 632 Q 146 632 146 577 L 146 276 L 402 102 L 658 276 "
    "L 658 577 Q 658 632 603 632 L 457 632 Q 402 632 402 577 L 402 502"
)


def _starburst(cx=402, cy=385, outer=110, inner=50, points=8):
    pts = []
    for i in range(points):
        a = math.radians(90 - i * (360 / points))
        pts.append((cx + outer * math.cos(a), cy - outer * math.sin(a)))
    d = f"M {pts[0][0]:.2f} {pts[0][1]:.2f}"
    for i in range(points):
        a = math.radians(90 - (i + 0.5) * (360 / points))
        ix, iy = cx + inner * math.cos(a), cy - inner * math.sin(a)
        nx, ny = pts[(i + 1) % points]
        d += f" L {ix:.2f} {iy:.2f} L {nx:.2f} {ny:.2f}"
    return d + " Z"


def draw_mark(x, y, height, reversed_=False):
    """Logo mark with its top-left at (x, y), scaled to `height` px tall."""
    s = height / MARK_H
    bubble_fill = WHITE if reversed_ else BRAND_NAVY
    house_stroke = BRAND_NAVY if reversed_ else WHITE
    return (
        f'<g transform="translate({x:.2f},{y:.2f}) scale({s:.5f})">'
        f'<path d="{_BUBBLE}" fill="{bubble_fill}"/>'
        f'<path d="{_HOUSE}" fill="none" stroke="{house_stroke}" '
        f'stroke-width="{_STROKE}" stroke-linecap="round" stroke-linejoin="round"/>'
        f'<rect x="384" y="380" width="37" height="124" fill="{BRAND_PINK}"/>'
        f'<path d="{_starburst()}" fill="{BRAND_PINK}"/>'
        f"</g>"
    )


def draw_lockup(x, y, mark_h, reversed_=False):
    """Mark + stacked ONE PLACE / LOCATORS wordmark. Returns (svg, total_width)."""
    mark_w = MARK_W / MARK_H * mark_h
    gap = mark_h * 0.155

    # The original lockup sets both wordmark lines to a common width. Size off
    # the longer line at its natural fit, then track the shorter one out to
    # match, so neither line ends up crushed.
    word_w = mark_h * 1.93
    size = size_to_fit("ONE PLACE", "extrabold", word_w)
    cap = cap_height(size, "extrabold")
    line_gap = mark_h * 0.056

    top = y + (mark_h - (2 * cap + line_gap)) / 2
    wx = x + mark_w + gap
    top_fill = WHITE if reversed_ else BRAND_NAVY

    parts = [draw_mark(x, y, mark_h, reversed_)]
    for i, (word, fill) in enumerate((("ONE PLACE", top_fill),
                                      ("LOCATORS", BRAND_GREEN))):
        tr = tracking_to_fit(word, size, "extrabold", word_w)
        baseline = top + cap + i * (cap + line_gap)
        parts.append(text(word, wx, baseline, size, "extrabold", fill, tracking=tr))
    return "".join(parts), mark_w + gap + word_w


# ---------------------------------------------------------------- ornaments


def frame(colour, width=1.5):
    """Hairline border, inset from the trim edge."""
    x = TX + FRAME_INSET
    y = TY + FRAME_INSET
    return (
        f'<rect x="{x}" y="{y}" width="{TRIM_W - 2 * FRAME_INSET}" '
        f'height="{TRIM_H - 2 * FRAME_INSET}" fill="none" stroke="{colour}" '
        f'stroke-width="{width}"/>'
    )


def smiley(cx, cy, r, colour, width=2.6):
    """Small line-drawn smile, sized to survive at card scale."""
    e = r * 0.34
    return (
        f'<g stroke="{colour}" fill="none" stroke-width="{width}" '
        f'stroke-linecap="round">'
        f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}"/>'
        f'<path d="M {cx - r * 0.46:.2f} {cy + r * 0.12:.2f} '
        f'Q {cx:.2f} {cy + r * 0.62:.2f} {cx + r * 0.46:.2f} {cy + r * 0.12:.2f}"/>'
        f"</g>"
        f'<circle cx="{cx - e:.2f}" cy="{cy - r * 0.26:.2f}" r="{width * 0.62:.2f}" '
        f'fill="{colour}"/>'
        f'<circle cx="{cx + e:.2f}" cy="{cy - r * 0.26:.2f}" r="{width * 0.62:.2f}" '
        f'fill="{colour}"/>'
    )


def contact_row(y, colour, accent):
    """Phone / email / site on one fine-tracked line, separated by dots."""
    size = size_for_cap(15, "light")
    tracking = 1.1
    gap = 20
    parts, x = [], L
    for i, value in enumerate((PHONE, EMAIL, SITE)):
        if i:
            parts.append(text("·", x, y, size, "light", accent))
            x += text_width("·", size, "light") + gap
        parts.append(text(value, x, y, size, "light", colour, tracking=tracking))
        x += text_width(value, size, "light", tracking) + gap
    return "".join(parts), x - gap


# ---------------------------------------------------------------- QR


def qr_svg(x, y, size, fg):
    import qrcode
    from qrcode.constants import ERROR_CORRECT_M

    q = qrcode.QRCode(error_correction=ERROR_CORRECT_M, border=0)
    q.add_data(QR_URL)
    q.make(fit=True)
    m = q.get_matrix()
    n = len(m)
    u = size / n

    # One rect per horizontal run rather than per module: fewer, larger shapes
    # print cleaner and keep the PDF small.
    rects = []
    for r, row in enumerate(m):
        c = 0
        while c < n:
            if row[c]:
                c0 = c
                while c < n and row[c]:
                    c += 1
                rects.append(
                    f'<rect x="{x + c0 * u:.3f}" y="{y + r * u:.3f}" '
                    f'width="{(c - c0) * u:.3f}" height="{u:.3f}"/>'
                )
            else:
                c += 1
    return f'<g fill="{fg}" shape-rendering="crispEdges">' + "".join(rects) + "</g>", n


# ---------------------------------------------------------------- card faces


def front():
    p = [f'<rect x="0" y="0" width="{FULL_W}" height="{FULL_H}" fill="{FIELD}"/>',
         frame(GOLD, 1.5)]

    # Portrait, right, on the card's vertical centreline.
    d = 258
    cx, cy = R - d / 2, FULL_H / 2 - 18
    p.append(
        f'<image xlink:href="{embedded_png("portrait.png")}" '
        f'x="{cx - d / 2:.2f}" y="{cy - d / 2:.2f}" width="{d}" height="{d}"/>'
    )
    p.append(
        f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{d / 2 + 7:.2f}" fill="none" '
        f'stroke="{GOLD}" stroke-width="1.8"/>'
    )

    # Logo, unchanged in size from the previous version.
    lockup, _ = draw_lockup(L, T, 86, reversed_=True)
    p.append(lockup)

    # Name in a high-contrast didone - the one element doing the heavy lifting.
    col_w = cx - d / 2 - 54 - L
    name_size = size_for_cap(44, "didot")
    name_tr = 3.0
    while text_width(NAME, name_size, "didot", name_tr) > col_w:
        name_size *= 0.98
    p.append(text(NAME, L, 352, name_size, "didot", WHITE, tracking=name_tr))

    title_size = size_for_cap(13, "light")
    p.append(text(TITLE, L, 398, title_size, "light", GOLD, tracking=5.2))

    # Contact details as one fine line along the foot, over a hairline.
    p.append(rule(L, B - 52, R - L, "#25406A", 1.2))
    row, _ = contact_row(B - 6, MIST, GOLD)
    p.append(row)
    return "".join(p)


def back(show_license=False):
    p = [f'<rect x="0" y="0" width="{FULL_W}" height="{FULL_H}" fill="{IVORY}"/>',
         frame(GOLD_SOFT, 1.3)]

    # QR, right. Panel padding is derived from the module pitch so the quiet
    # zone is always satisfied.
    qr_size = 285
    _, modules = qr_svg(0, 0, qr_size, BRAND_NAVY)
    module_mm = (qr_size / modules) * 25.4 / DPI
    if module_mm < QR_MIN_MODULE_MM:
        raise SystemExit(
            f"QR module is {module_mm:.3f} mm, below the {QR_MIN_MODULE_MM} mm "
            f"print floor - enlarge the code."
        )
    qx = R - qr_size
    qy = (FULL_H - qr_size) / 2
    qr, _ = qr_svg(qx, qy, qr_size, FIELD)
    p.append(qr)

    # Invitation, left.
    lockup, _ = draw_lockup(L, T + 4, 86)
    p.append(lockup)

    # Invitation block, centred against the QR panel beside it.
    p.append(rule(L, 286, 76, GOLD_SOFT, 1.6))

    eyebrow_size = size_for_cap(13, "medium")
    p.append(text(QR_EYEBROW, L, 352, eyebrow_size, "medium", GOLD_SOFT, tracking=3.6))

    line_size = size_for_cap(26, "didot")
    p.append(text(QR_LINE, L, 414, line_size, "didot", FIELD, tracking=1.2))
    p.append(
        smiley(L + text_width(QR_LINE, line_size, "didot", 1.2) + 30, 404, 15,
               GOLD_SOFT, 2.6)
    )

    # Website anchors the foot so the column is not top-heavy.
    site_size = size_for_cap(14, "light")
    p.append(text(SITE, L, B - 26, site_size, "light", "#6B7688", tracking=2.4))

    if show_license:
        lic_size = size_for_cap(11, "light")
        p.append(text(LICENSE, L, B + 12, lic_size, "light", "#9AA3B0", tracking=0.3))
    return "".join(p)


# ---------------------------------------------------------------- output


def wrap(body, guides=False):
    g = ""
    if guides:
        g = (
            f'<rect x="{TX}" y="{TY}" width="{TRIM_W}" height="{TRIM_H}" fill="none" '
            f'stroke="#FF00FF" stroke-width="1.5" stroke-dasharray="9 9"/>'
            f'<rect x="{L}" y="{T}" width="{R - L}" height="{B - T}" fill="none" '
            f'stroke="#00A0FF" stroke-width="1.5" stroke-dasharray="5 7"/>'
        )
    return textwrap.dedent(
        f"""\
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
             width="{FULL_W / DPI}in" height="{FULL_H / DPI}in"
             viewBox="0 0 {FULL_W} {FULL_H}">
        {body}{g}
        </svg>
        """
    )


def render(name, svg_text):
    svg_path = os.path.join(OUT, f"{name}.svg")
    with open(svg_path, "w") as fh:
        fh.write(svg_text)
    subprocess.run(
        ["rsvg-convert", "-f", "pdf", "-d", str(DPI), "-p", str(DPI),
         "-o", os.path.join(OUT, f"{name}.pdf"), svg_path],
        check=True,
    )
    subprocess.run(
        ["rsvg-convert", "-f", "png", "-w", str(int(FULL_W)),
         "-o", os.path.join(OUT, f"{name}.png"), svg_path],
        check=True,
    )


def combined_pdf(name, pages):
    """Merge single-page PDFs into the front-then-back file printers ask for."""
    import pypdfium2 as pdfium

    doc = pdfium.PdfDocument.new()
    for page in pages:
        doc.import_pages(pdfium.PdfDocument(os.path.join(OUT, f"{page}.pdf")))
    doc.save(os.path.join(OUT, f"{name}.pdf"))


def preview():
    """Trim the bleed off and mock both faces up on a neutral backdrop."""
    from PIL import Image, ImageDraw

    faces = []
    for name in ("card-front", "card-back"):
        im = Image.open(os.path.join(OUT, f"{name}.png")).convert("RGB")
        im = im.crop((int(TX), int(TY), int(TX + TRIM_W), int(TY + TRIM_H)))
        im.save(os.path.join(OUT, f"{name}-trimmed.png"))
        faces.append(im)

    pad, gap, radius = 76, 60, 24
    sheet = Image.new(
        "RGB", (pad * 2 + TRIM_W, pad * 2 + TRIM_H * 2 + gap), "#DFE3EA"
    )
    mask = Image.new("L", (TRIM_W * 4, TRIM_H * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, TRIM_W * 4 - 1, TRIM_H * 4 - 1), radius=radius * 4, fill=255
    )
    mask = mask.resize((TRIM_W, TRIM_H), Image.LANCZOS)
    for i, face in enumerate(faces):
        y = pad + i * (TRIM_H + gap)
        sheet.paste(Image.new("RGB", (TRIM_W, TRIM_H), "#B9C0CC"), (pad, y + 8), mask)
        sheet.paste(face, (pad, y), mask)
    sheet.save(os.path.join(OUT, "preview.png"))


def main():
    os.makedirs(OUT, exist_ok=True)
    render("card-front", wrap(front()))
    render("card-back", wrap(back()))
    render("card-back-license", wrap(back(show_license=True)))
    render("card-front-guides", wrap(front(), guides=True))
    combined_pdf("card-print-ready", ["card-front", "card-back"])
    combined_pdf("card-print-ready-with-license", ["card-front", "card-back-license"])
    preview()
    print(f"wrote artwork to {OUT}")


if __name__ == "__main__":
    main()
