# Business card — Sophia Reddehase / One Place Locators

3.5 × 2 in, with 0.125 in bleed on every edge (so every file is 3.75 × 2.25 in —
that is expected, the printer trims it back to 3.5 × 2).

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

## The design

Deep navy front, ivory back, gold hairline detailing on both.

- **Front** — logo, name, title, portrait, and a single fine-tracked line of
  contact details along the foot.
- **Back** — logo, the invitation to scan, and the QR.

The name is set in GFS Didot, a high-contrast didone; everything else is
Montserrat Light on wide tracking. That pairing — one elegant serif against
finely spaced sans — is what reads as expensive.

Gold (`#C0A063` on navy, `#8C7440` on ivory) is an addition to the brand
palette, not something taken from the original artwork. It is what makes the
card read as luxury rather than corporate. If it should print as real metallic
foil rather than flat ink, tell the printer — the artwork works either way. If
gold is unwanted, swapping `GOLD` and `GOLD_SOFT` for the brand green reverts to
a strictly on-brand palette.

## Print notes

- **Bleed.** The navy and ivory fields run to the edge of the artboard. Don't
  "fit to page" — that scales the bleed into the trim area.
- **Heavy ink coverage.** The front is full-bleed navy. Ask for a matte or soft-touch
  laminate: it suits the design and stops fingerprints showing, which they will
  on an unlaminated dark card.
- **QR size.** The form URL is 175 characters, which needs a 53-module code.
  At the 0.95 in size used here each module is ~0.46 mm, comfortably above the
  ~0.4 mm floor below which printed codes stop scanning reliably. Shrinking the
  QR will break it. `build_card.py` fails the build if the module drops below
  that floor rather than emitting artwork that can't be scanned.
- **Colour.** Artwork is RGB. If the printer asks for CMYK, let them convert, or
  say so and it can be re-exported. Deep navies shift slightly in CMYK — worth
  asking for a proof.

## Rebuilding

```
python3 prep_photo.py <source.jpg>   # writes assets/portrait.png
python3 build_card.py                # writes ./out
```

Needs `rsvg-convert` (librsvg), the Montserrat and GFS Didot font families, and
Python `pillow`, `qrcode`, `pypdfium2`.

Text lives at the top of `build_card.py` — `NAME`, `PHONE`, `EMAIL`, `SITE`,
`QR_URL`, `QR_EYEBROW`, `QR_LINE`. Change a value and re-run.

`prep_photo.py` crops the portrait out of the full-body original, throws the
background progressively out of focus so the face carries the frame, grades it
warmer, and masks it to a circle. `CROP` at the top of that file is the
head-and-shoulders box; adjust it to reframe.

## About the logo

The original was only available as a 600 × 300 flattened PNG, too coarse for
print. The mark is redrawn here as vector geometry measured off that artwork at
16× (bubble, house outline, starburst), and the wordmark is set in Montserrat
ExtraBold, so the whole lockup is resolution-independent. If the real vector
logo turns up, swap `draw_lockup()` to place it instead.
