#!/usr/bin/env python3
"""Generate the app icons: a copper tally of five struck into the dark plate.

No image library in the build environment, so this writes PNGs directly with
zlib. Re-run it if the palette in index.html changes.
"""
import zlib, struct, os

GROUND = (0x0F, 0x11, 0x18)
COPPER = (0xC4, 0x85, 0x4B)
LIT    = (0xE0, 0xA8, 0x68)
DEEP   = (0x7A, 0x50, 0x28)

def png(path, size, pixels):
    raw = b"".join(b"\x00" + bytes(v for px in row for v in px) for row in pixels)
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    out = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(raw, 9))
           + chunk(b"IEND", b""))
    open(path, "wb").write(out)

def blend(dst, src, a):
    return tuple(round(d + (s - d) * a) for d, s in zip(dst, src))

def render(size):
    S = size
    px = [[GROUND for _ in range(S)] for _ in range(S)]

    # four upright strikes plus one struck across them: the tally of five.
    bar_w   = S * 0.072
    bar_h   = S * 0.44
    gap     = S * 0.108
    total   = bar_w * 4 + gap * 3
    x0      = (S - total) / 2
    y0      = (S - bar_h) / 2

    def cover(x, y, ax, ay, bx, by, w):
        """Anti-aliased coverage of a thick segment, sampled 3x3 per pixel."""
        hits = 0
        for sy in range(3):
            for sx in range(3):
                pxx, pyy = x + (sx + .5) / 3, y + (sy + .5) / 3
                dx, dy = bx - ax, by - ay
                L2 = dx * dx + dy * dy
                t = 0 if L2 == 0 else max(0, min(1, ((pxx - ax) * dx + (pyy - ay) * dy) / L2))
                cx, cy = ax + t * dx, ay + t * dy
                if (pxx - cx) ** 2 + (pyy - cy) ** 2 <= (w / 2) ** 2:
                    hits += 1
        return hits / 9

    segs = []
    for i in range(4):
        x = x0 + i * (bar_w + gap) + bar_w / 2
        segs.append((x, y0, x, y0 + bar_h, bar_w, i))
    # the fifth strike lies across the other four
    segs.append((x0 - bar_w * 0.35, y0 + bar_h * 0.82,
                 x0 + total + bar_w * 0.35, y0 + bar_h * 0.18, bar_w * 0.95, 4))

    for y in range(S):
        for x in range(S):
            for ax, ay, bx, by, w, idx in segs:
                a = cover(x, y, ax, ay, bx, by, w)
                if a <= 0:
                    continue
                # vertical gradient down each strike, brightest at the top
                f = (y - y0) / bar_h if bar_h else 0
                f = max(0.0, min(1.0, f))
                base = LIT if idx == 4 else tuple(round(l + (d - l) * f) for l, d in zip(LIT, DEEP))
                px[y][x] = blend(px[y][x], base, a)
    return px

here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(os.path.dirname(here), "icons")
os.makedirs(out, exist_ok=True)
for s, name in [(192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png"), (32, "favicon-32.png")]:
    png(os.path.join(out, name), s, render(s))
    print("wrote", name, s)
