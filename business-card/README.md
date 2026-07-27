# Business card — Sophia Reddehase / One Place Locators

Rebuilt from the old email-signature banner. 3.5 × 2 in, with 0.125 in bleed on
every edge (so every file is 3.75 × 2.25 in — that is expected, the printer
trims it back to 3.5 × 2).

## Which file to send the printer

| File | Use |
| --- | --- |
| `out/card-print-ready.pdf` | **Send this one.** 2 pages: front, then back. |
| `out/card-print-ready-with-license.pdf` | Same, but the back carries `One Place Locators · TREC License #831516`. |
| `out/card-front.pdf`, `out/card-back.pdf` | Single-page versions if the printer wants each side separately. |
| `out/card-front.png`, `out/card-back.png` | 300 DPI raster, for uploaders that only take images. |

Previews (not for print): `out/preview.png`, `out/*-trimmed.png` show the card
as it looks *after* trimming. `out/card-front-guides.pdf` overlays the trim line
(magenta) and safe area (blue).

## What's on it

- **Front** — logo, headshot, name, title, phone, email, website.
- **Back** — call to action and the QR code, over navy.

The QR points at the Zoho intake form with `Lead_Owner_Email` pre-filled, so
scans land in the CRM already attributed to Sophia.

## Print notes

- **Bleed.** Background colour runs to the edge of the artboard. Don't
  "fit to page" — that scales the bleed into the trim area.
- **QR size.** The form URL is 175 characters, which needs a 53-module code.
  At the 0.95 in size used here each module is ~0.46 mm, comfortably above the
  ~0.4 mm floor below which printed codes stop scanning reliably. Shrinking the
  QR will break it. `build_card.py` fails the build if the module drops below
  that floor rather than emitting artwork that can't be scanned.
- **Colour.** Artwork is RGB (navy `#10377B`, green `#3EB489`, pink `#FF206E`).
  If the printer asks for CMYK, let them convert, or say so and it can be
  re-exported.
- **Headshot** is the only raster element, recovered from the old signature at
  ~194 px across. It is sharp at the 0.62 in size used here — a bigger crop
  would show it. A higher-resolution original would let the photo grow.

## Rebuilding

```
python3 build_card.py          # writes ./out
```

Needs `rsvg-convert` (librsvg), the Montserrat font family, and Python
`pillow`, `qrcode`, `pypdfium2`.

Text lives at the top of `build_card.py` — `NAME`, `PHONE`, `EMAIL`, `SITE`,
`QR_URL`, `QR_CAPTION`, `CTA_LINES`. Change a value and re-run.

## About the logo

The original was only available as a 600 × 300 flattened PNG, too coarse for
print. The mark is redrawn here as vector geometry measured off that artwork at
16× (bubble, house outline, starburst), and the wordmark is set in Montserrat
ExtraBold, so the whole lockup is resolution-independent. If the real vector
logo turns up, swap `draw_lockup()` to place it instead.
