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
BLEED_IN = 0.125

TRIM_W, TRIM_H = int(TRIM_W_IN * DPI), int(TRIM_H_IN * DPI)   # 1050 x 600
BLEED = int(BLEED_IN * DPI)                                    # 37 (see below)
BLEED = 37.5
FULL_W, FULL_H = TRIM_W + 2 * BLEED, TRIM_H + 2 * BLEED        # 1125 x 675

# Origin of the trim box inside the full (bleed) artboard.
TX, TY = BLEED, BLEED

MARGIN = 60                       # content inset from the trim edge (0.2 in)
L = TX + MARGIN                   # left content edge
R = TX + TRIM_W - MARGIN          # right content edge
T = TY + MARGIN                   # top content edge
B = TY + TRIM_H - MARGIN          # bottom content edge

# Brand colours sampled from the original artwork.
NAVY = "#10377B"
GREEN = "#3EB489"
PINK = "#FF206E"
WHITE = "#FFFFFF"
INK = "#1B2A4A"                   # softened navy for body copy

FONT_DIR = "/usr/share/fonts/truetype/montserrat"
FACES = {
    800: ("Montserrat-ExtraBold.ttf", "Montserrat", 800),
    700: ("Montserrat-Bold.ttf", "Montserrat", 700),
    600: ("Montserrat-SemiBold.ttf", "Montserrat", 600),
    500: ("Montserrat-Medium.ttf", "Montserrat", 500),
}

# ---------------------------------------------------------------- contact data

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
QR_CAPTION = "SCAN TO GET STARTED"
CTA_LINES = ("Let's find your", "next place.")

# Printed QR modules below ~0.4 mm stop surviving ink spread on uncoated stock.
# At 175 characters this payload needs 53 modules, so the code has to be about
# an inch across - hence it lives on the back, not squeezed onto the front.
QR_MIN_MODULE_MM = 0.40


# ---------------------------------------------------------------- text metrics


def _face(weight):
    return os.path.join(FONT_DIR, FACES[weight][0])


# PIL only accepts integer pixel sizes, so every metric is measured once at a
# large probe size and scaled linearly. Measuring at the real size would quantise
# badly for small type.
_PROBE = 512


def text_width(s, size, weight, tracking=0.0):
    """Advance width of `s` at `size` px, including per-gap tracking."""
    font = ImageFont.truetype(_face(weight), _PROBE)
    w = font.getlength(s) * size / _PROBE
    return w + tracking * max(len(s) - 1, 0)


def tracking_to_fit(s, size, weight, target):
    """Letter-spacing that makes `s` render exactly `target` px wide."""
    gaps = max(len(s) - 1, 0)
    if not gaps:
        return 0.0
    return (target - text_width(s, size, weight)) / gaps


def cap_height(size, weight):
    font = ImageFont.truetype(_face(weight), _PROBE)
    bbox = font.getbbox("H")
    return (bbox[3] - bbox[1]) * size / _PROBE


def size_for_cap(cap, weight):
    """Font size whose cap height is `cap` px."""
    return cap * _PROBE / cap_height(_PROBE, weight)


def size_to_fit(s, weight, target):
    """Font size at which `s` naturally renders `target` px wide."""
    return target * _PROBE / ImageFont.truetype(_face(weight), _PROBE).getlength(s)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def embedded_png(filename):
    """Inline an asset as a data URI so the SVG/PDF is self-contained."""
    import base64

    with open(os.path.join(ASSETS, filename), "rb") as fh:
        return "data:image/png;base64," + base64.b64encode(fh.read()).decode()


def text(s, x, y, size, weight, fill, tracking=0.0, anchor="start"):
    ls = f' letter-spacing="{tracking:.3f}"' if tracking else ""
    return (
        f'<text x="{x:.2f}" y="{y:.2f}" font-family="Montserrat" '
        f'font-weight="{FACES[weight][2]}" font-size="{size:.2f}" fill="{fill}" '
        f'text-anchor="{anchor}"{ls} xml:space="preserve">{esc(s)}</text>'
    )


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
    bubble_fill = WHITE if reversed_ else NAVY
    house_stroke = NAVY if reversed_ else WHITE
    return (
        f'<g transform="translate({x:.2f},{y:.2f}) scale({s:.5f})">'
        f'<path d="{_BUBBLE}" fill="{bubble_fill}"/>'
        f'<path d="{_HOUSE}" fill="none" stroke="{house_stroke}" '
        f'stroke-width="{_STROKE}" stroke-linecap="round" stroke-linejoin="round"/>'
        f'<rect x="384" y="380" width="37" height="124" fill="{PINK}"/>'
        f'<path d="{_starburst()}" fill="{PINK}"/>'
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
    size = size_to_fit("ONE PLACE", 800, word_w)
    cap = cap_height(size, 800)
    line_gap = mark_h * 0.056

    top = y + (mark_h - (2 * cap + line_gap)) / 2
    wx = x + mark_w + gap
    top_fill = WHITE if reversed_ else NAVY

    parts = [draw_mark(x, y, mark_h, reversed_)]
    for i, (word, fill) in enumerate((("ONE PLACE", top_fill), ("LOCATORS", GREEN))):
        tr = tracking_to_fit(word, size, 800, word_w)
        baseline = top + cap + i * (cap + line_gap)
        parts.append(text(word, wx, baseline, size, 800, fill, tracking=tr))
    return "".join(parts), mark_w + gap + word_w


# ---------------------------------------------------------------- QR


def qr_svg(x, y, size, fg=NAVY):
    import qrcode
    from qrcode.constants import ERROR_CORRECT_M

    q = qrcode.QRCode(error_correction=ERROR_CORRECT_M, border=0)
    q.add_data(QR_URL)
    q.make(fit=True)
    m = q.get_matrix()
    n = len(m)
    u = size / n

    # Emit one rect per horizontal run rather than per module: fewer, larger
    # shapes print cleaner and keep the PDF small.
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


# ---------------------------------------------------------------- icons


def icon(kind, cx, cy, r, color):
    """Small line glyph centred on (cx, cy) inside a circle of radius r."""
    sw = r * 0.17
    g = f'<g stroke="{color}" fill="none" stroke-width="{sw:.2f}" ' \
        f'stroke-linecap="round" stroke-linejoin="round">'
    k = r * 0.52
    if kind == "phone":
        g += (
            f'<path d="M {cx - k * 0.75} {cy - k} '
            f'q {-k * 0.28} {k * 0.55} {k * 0.36} {k * 1.12} '
            f'q {k * 0.92} {k * 0.92} {k * 1.5} {k * 0.55} '
            f'l {k * 0.34} {k * 0.5} '
            f'q {-k * 0.75} {k * 0.72} {-k * 1.75} {-k * 0.1} '
            f'q {-k * 1.15} {-k * 0.95} {-k * 1.3} {-k * 1.75} '
            f'q {-k * 0.06} {-k * 0.5} {k * 0.62} {-k * 0.82} z"/>'
        )
    elif kind == "mail":
        g += (
            f'<rect x="{cx - k}" y="{cy - k * 0.72}" width="{2 * k}" '
            f'height="{1.44 * k}" rx="{k * 0.2}"/>'
            f'<path d="M {cx - k} {cy - k * 0.55} L {cx} {cy + k * 0.18} '
            f'L {cx + k} {cy - k * 0.55}"/>'
        )
    elif kind == "globe":
        g += (
            f'<circle cx="{cx}" cy="{cy}" r="{k}"/>'
            f'<path d="M {cx - k} {cy} L {cx + k} {cy}"/>'
            f'<ellipse cx="{cx}" cy="{cy}" rx="{k * 0.45}" ry="{k}"/>'
        )
    return g + "</g>"


# ---------------------------------------------------------------- card faces


def front():
    p = [f'<rect x="0" y="0" width="{FULL_W}" height="{FULL_H}" fill="{WHITE}"/>']

    # Header: logo lockup left, headshot right.
    mark_h = 86
    lockup, _ = draw_lockup(L, T + 2, mark_h)
    p.append(lockup)

    photo_d = 186
    photo_cx = R - photo_d / 2
    photo_cy = T + mark_h / 2 + 2
    p.append(
        f'<image xlink:href="{embedded_png("headshot.png")}" '
        f'x="{photo_cx - photo_d / 2:.2f}" y="{photo_cy - photo_d / 2:.2f}" '
        f'width="{photo_d}" height="{photo_d}"/>'
    )
    p.append(
        f'<circle cx="{photo_cx:.2f}" cy="{photo_cy:.2f}" r="{photo_d / 2 + 5:.2f}" '
        f'fill="none" stroke="{GREEN}" stroke-width="3.5"/>'
    )

    rule_y = T + 150
    p.append(
        f'<rect x="{L}" y="{rule_y}" width="{R - L}" height="2.5" fill="#DCE3EE"/>'
    )

    # Name + title.
    name_cap = 46
    name_size = size_for_cap(name_cap, 800)
    name_base = rule_y + 78
    p.append(text(NAME, L, name_base, name_size, 800, NAVY, tracking=-0.6))

    title_cap = 17
    title_size = size_for_cap(title_cap, 700)
    p.append(
        text(TITLE, L, name_base + 46, title_size, 700, GREEN, tracking=3.4)
    )

    # Contact stack, bottom-left.
    rows = [("phone", PHONE), ("mail", EMAIL), ("globe", SITE)]
    body_cap = 21
    body_size = size_for_cap(body_cap, 500)
    pitch = 52
    first = B - pitch * 2
    for i, (kind, value) in enumerate(rows):
        cy = first + i * pitch
        p.append(icon(kind, L + 15, cy - body_cap * 0.38, 17, GREEN))
        p.append(text(value, L + 48, cy, body_size, 500, INK))

    # Footer stripe, bled off three edges, to anchor the composition. The colour
    # break lines up with the left edge of the portrait above it.
    visible = 26                      # height that survives the trim
    bar_y = TY + TRIM_H - visible
    split = photo_cx - photo_d / 2
    p.append(
        f'<rect x="0" y="{bar_y}" width="{FULL_W}" height="{FULL_H - bar_y}" '
        f'fill="{GREEN}"/>'
        f'<rect x="{split:.1f}" y="{bar_y}" width="{FULL_W - split:.1f}" '
        f'height="{FULL_H - bar_y}" fill="{NAVY}"/>'
    )
    return "".join(p)


def back(show_license=False):
    p = [f'<rect x="0" y="0" width="{FULL_W}" height="{FULL_H}" fill="{NAVY}"/>']

    # QR on a white panel, right-hand side. The panel padding is set from the
    # module pitch so the mandatory quiet zone is always satisfied.
    qr_size = 285
    _, modules = qr_svg(0, 0, qr_size)
    module = qr_size / modules
    if module * 25.4 / DPI < QR_MIN_MODULE_MM:
        raise SystemExit(
            f"QR module is {module * 25.4 / DPI:.3f} mm, below the "
            f"{QR_MIN_MODULE_MM} mm print floor - enlarge the code."
        )
    pad = max(4 * module, 34)
    panel = qr_size + 2 * pad
    px = R - panel
    py = (FULL_H - panel) / 2
    p.append(
        f'<rect x="{px:.2f}" y="{py:.2f}" width="{panel:.2f}" height="{panel:.2f}" '
        f'rx="26" fill="{WHITE}"/>'
    )
    qr, _ = qr_svg(px + pad, py + pad, qr_size)
    p.append(qr)

    # Call to action, left-hand side, optically centred against the QR panel.
    cx = L
    top = py + 12
    lockup, _ = draw_lockup(cx, top, 68, reversed_=True)
    p.append(lockup)

    eyebrow_size = size_for_cap(13, 700)
    p.append(text(QR_CAPTION, cx, top + 154, eyebrow_size, 700, GREEN, tracking=3.0))

    head_size = size_for_cap(34, 800)
    for i, line in enumerate(CTA_LINES):
        p.append(text(line, cx, top + 220 + i * 52, head_size, 800, WHITE, tracking=-0.4))

    site_size = size_for_cap(15, 600)
    p.append(text(SITE, cx, top + 356, site_size, 600, "#8FA6CE", tracking=1.4))

    if show_license:
        lic_size = size_for_cap(11, 500)
        p.append(text(LICENSE, cx, B + 6, lic_size, 500, "#7C93BE", tracking=0.3))
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


def render(name, svg_text, png_scale=1.0):
    svg_path = os.path.join(OUT, f"{name}.svg")
    with open(svg_path, "w") as fh:
        fh.write(svg_text)
    subprocess.run(
        ["rsvg-convert", "-f", "pdf", "-d", str(DPI), "-p", str(DPI),
         "-o", os.path.join(OUT, f"{name}.pdf"), svg_path],
        check=True,
    )
    subprocess.run(
        ["rsvg-convert", "-f", "png", "-w", str(int(FULL_W * png_scale)),
         "-o", os.path.join(OUT, f"{name}.png"), svg_path],
        check=True,
    )
    return svg_path


def preview():
    """Trim the bleed off and mock both faces up on a neutral backdrop."""
    from PIL import Image, ImageDraw

    faces = []
    for name in ("card-front", "card-back"):
        im = Image.open(os.path.join(OUT, f"{name}.png")).convert("RGB")
        im = im.crop((int(TX), int(TY), int(TX + TRIM_W), int(TY + TRIM_H)))
        im.save(os.path.join(OUT, f"{name}-trimmed.png"))
        faces.append(im)

    pad, gap, radius = 70, 56, 26
    w = pad * 2 + TRIM_W
    h = pad * 2 + TRIM_H * 2 + gap
    sheet = Image.new("RGB", (w, h), "#EEF1F6")
    mask = Image.new("L", (TRIM_W * 4, TRIM_H * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, TRIM_W * 4 - 1, TRIM_H * 4 - 1), radius=radius * 4, fill=255
    )
    mask = mask.resize((TRIM_W, TRIM_H), Image.LANCZOS)
    for i, face in enumerate(faces):
        y = pad + i * (TRIM_H + gap)
        shadow = Image.new("RGB", (TRIM_W, TRIM_H), "#C9D2E0")
        sheet.paste(shadow, (pad, y + 7), mask)
        sheet.paste(face, (pad, y), mask)
    sheet.save(os.path.join(OUT, "preview.png"))


def combined_pdf(name, pages):
    """Merge single-page PDFs into the front-then-back file printers ask for."""
    import pypdfium2 as pdfium

    doc = pdfium.PdfDocument.new()
    for page in pages:
        src = pdfium.PdfDocument(os.path.join(OUT, f"{page}.pdf"))
        doc.import_pages(src)
    doc.save(os.path.join(OUT, f"{name}.pdf"))


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
