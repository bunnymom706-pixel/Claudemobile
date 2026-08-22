#!/usr/bin/env python3
"""Icons for the Mirror: an eye-chart of descending bars on clinical paper."""
import zlib, struct, os

PAPER = (0xF3, 0xF4, 0xF7)
INK   = (0x16, 0x18, 0x1D)
TEAL  = (0x0F, 0x52, 0x57)

def png(path, size, px):
    raw = b"".join(b"\x00" + bytes(v for p in row for v in p) for row in px)
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    open(path, "wb").write(b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))

def blend(d, s, a): return tuple(round(x + (y - x) * a) for x, y in zip(d, s))

def render(S):
    px = [[PAPER for _ in range(S)] for _ in range(S)]
    # four rows, descending in width and height, like a chart read top to bottom
    rows = [(0.72, 0.150), (0.54, 0.110), (0.38, 0.078), (0.24, 0.054)]
    gap = S * 0.045
    total = sum(r[1] for r in rows) * S + gap * (len(rows) - 1)
    y = (S - total) / 2
    for i, (w, h) in enumerate(rows):
        bw, bh = w * S, h * S
        x0, y0 = (S - bw) / 2, y
        colour = TEAL if i == 0 else INK
        for yy in range(int(y0) - 1, int(y0 + bh) + 2):
            if not (0 <= yy < S): continue
            for xx in range(int(x0) - 1, int(x0 + bw) + 2):
                if not (0 <= xx < S): continue
                # box coverage, sampled 3x3 for clean edges
                hits = sum(1 for sy in range(3) for sx in range(3)
                           if x0 <= xx + (sx + .5) / 3 <= x0 + bw and y0 <= yy + (sy + .5) / 3 <= y0 + bh)
                if hits: px[yy][xx] = blend(px[yy][xx], colour, hits / 9)
        y += bh + gap
    return px

out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "mirror", "icons")
os.makedirs(out, exist_ok=True)
for s, n in [(192,"icon-192.png"), (512,"icon-512.png"), (180,"apple-touch-icon.png"), (32,"favicon-32.png")]:
    png(os.path.join(out, n), s, render(s)); print("wrote", n)
