"""Draws the Tracker icons: a white check mark on blue. The name shows under the icon, not on it.

Usage: python3 scripts/make-icons.py public   (needs Pillow)
"""
from PIL import Image, ImageDraw
import sys, os

BLUE = (47, 111, 219, 255)
WHITE = (255, 255, 255, 255)
SS = 4  # supersampling for smooth edges

def draw(size, rounded, scale=1.0):
    S = size * SS
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.225), fill=BLUE)
    else:
        d.rectangle([0, 0, S, S], fill=BLUE)

    def p(x, y):  # position inside the (optionally shrunk) content area
        off = (1 - scale) / 2
        return ((off + x * scale) * S, (off + y * scale) * S)

    w = int(S * 0.09 * scale)
    pts = [p(0.25, 0.52), p(0.42, 0.68), p(0.75, 0.33)]
    # Paint the check mark with a round brush, so the ends and the corner are smooth.
    r = w / 2
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        steps = int(max(abs(x1 - x0), abs(y1 - y0)))
        for i in range(steps + 1):
            x = x0 + (x1 - x0) * i / steps
            y = y0 + (y1 - y0) * i / steps
            d.ellipse([x - r, y - r, x + r, y + r], fill=WHITE)

    return img.resize((size, size), Image.LANCZOS)

out = sys.argv[1]
os.makedirs(f'{out}/icons', exist_ok=True)
draw(512, True).save(f'{out}/icons/icon-512.png')
draw(192, True).save(f'{out}/icons/icon-192.png')
draw(512, False, scale=0.8).save(f'{out}/icons/icon-maskable-512.png')
draw(180, False).convert('RGB').save(f'{out}/apple-touch-icon.png')
fav = draw(256, True)
fav.save(f'{out}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print('icons written to', out)
