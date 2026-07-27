#!/usr/bin/env python3
"""
Turn the poolside snapshot into a card-ready circular portrait.

The source is a full-body shot against a busy tree/building background. This
crops to head-and-shoulders, throws the background progressively out of focus
so the face carries the frame, warms and lifts it slightly, then masks to a
circle with a transparent surround.

    python3 prep_photo.py <source.jpg>
"""

import os
import sys

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")

# Head-and-shoulders box located in the 3024x4032 original, framed so the eyes
# sit near the upper third of the circle.
CROP = (1346, 1382, 1906, 1942)

OUT_SIZE = 900          # generous: the card uses well under this
SHARP_R = 0.30          # radius (as a fraction of the frame) kept fully sharp
BLUR_PX = 7             # background defocus at the rim


def build(src_path):
    src = Image.open(src_path).convert("RGB")
    face = src.crop(CROP).resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)

    # Progressive defocus: sharp through the face, softening toward the rim.
    # Mask is white where the sharp original shows through. Rings are painted
    # largest-first so the sharp centre lands on top.
    blurred = face.filter(ImageFilter.GaussianBlur(BLUR_PX))
    ramp = Image.new("L", (OUT_SIZE, OUT_SIZE), 0)
    draw = ImageDraw.Draw(ramp)
    steps = 48
    for i in range(steps + 1):
        t = i / steps                                   # 0 at the rim, 1 at centre
        r = OUT_SIZE * (0.52 - (0.52 - SHARP_R) * t)
        draw.ellipse(
            (OUT_SIZE / 2 - r, OUT_SIZE / 2 - r, OUT_SIZE / 2 + r, OUT_SIZE / 2 + r),
            fill=int(255 * t),
        )
    ramp = ramp.filter(ImageFilter.GaussianBlur(OUT_SIZE * 0.04))
    face = Image.composite(face, blurred, ramp)

    # Gentle grade: a touch warmer, a touch more contrast, lightly sharpened.
    r, g, b = face.split()
    face = Image.merge(
        "RGB",
        (
            r.point(lambda v: min(255, int(v * 1.035))),
            g,
            b.point(lambda v: int(v * 0.975)),
        ),
    )
    face = ImageEnhance.Contrast(face).enhance(1.08)
    face = ImageEnhance.Color(face).enhance(1.05)
    face = face.filter(ImageFilter.UnsharpMask(radius=2, percent=55, threshold=3))

    # Circular mask, antialiased via a 4x supersample.
    mask = Image.new("L", (OUT_SIZE * 4, OUT_SIZE * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, OUT_SIZE * 4 - 1, OUT_SIZE * 4 - 1), fill=255)
    mask = mask.resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)

    out = Image.new("RGBA", (OUT_SIZE, OUT_SIZE), (0, 0, 0, 0))
    out.paste(face, (0, 0), mask)

    os.makedirs(ASSETS, exist_ok=True)
    dest = os.path.join(ASSETS, "portrait.png")
    out.save(dest)
    print(f"wrote {dest} ({OUT_SIZE}x{OUT_SIZE})")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: prep_photo.py <source.jpg>")
    build(sys.argv[1])
