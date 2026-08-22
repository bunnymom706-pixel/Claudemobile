#!/usr/bin/env python3
"""Strike icons: an ember-gradient ring, partly filled, on near-black."""
import zlib, struct, os, math

GROUND=(0x0B,0x0D,0x12); A=(0xFF,0x7A,0x4D); B=(0xFF,0x4D,0x7D); TRACK=(0x23,0x28,0x36)

def png(path,size,px):
    raw=b"".join(b"\x00"+bytes(v for p in row for v in p) for row in px)
    def ch(t,d):
        c=t+d; return struct.pack(">I",len(d))+c+struct.pack(">I",zlib.crc32(c)&0xffffffff)
    open(path,"wb").write(b"\x89PNG\r\n\x1a\n"+ch(b"IHDR",struct.pack(">IIBBBBB",size,size,8,2,0,0,0))
        +ch(b"IDAT",zlib.compress(raw,9))+ch(b"IEND",b""))

def blend(d,s,a): return tuple(round(x+(y-x)*a) for x,y in zip(d,s))

def render(S):
    px=[[GROUND]*S for _ in range(S)]
    cx=cy=S/2; R=S*0.335; W=S*0.115
    # ring: track full circle, ember fill over 70% starting at top
    for y in range(S):
        for x in range(S):
            hits_t=0; hits_f=0; gsum=0.0
            for sy in range(3):
                for sx in range(3):
                    X=x+(sx+.5)/3-cx; Y=y+(sy+.5)/3-cy
                    r=math.hypot(X,Y)
                    if abs(r-R)<=W/2:
                        ang=(math.degrees(math.atan2(X,-Y)))%360  # 0 at top, clockwise
                        hits_t+=1
                        if ang<=252:  # 70% of the day struck
                            hits_f+=1; gsum+=ang/252
            if hits_t:
                px[y][x]=blend(px[y][x],TRACK,hits_t/9)
            if hits_f:
                g=gsum/hits_f
                col=tuple(round(a+(b-a)*g) for a,b in zip(A,B))
                px[y][x]=blend(px[y][x],col,hits_f/9)
    return px

out=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),"strike","icons")
os.makedirs(out,exist_ok=True)
for s,n in [(192,"icon-192.png"),(512,"icon-512.png"),(180,"apple-touch-icon.png"),(32,"favicon-32.png")]:
    png(os.path.join(out,n),s,render(s)); print("wrote",n)
