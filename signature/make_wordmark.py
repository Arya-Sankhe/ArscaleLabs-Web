"""Halftone ARCSCALE wordmark for the light-mode email signature -> public/signature-wordmark.png
Needs: pip install pillow; wm.png = black wordmark on white (rendered from the site's SVG symbol)."""
import sys, random
from PIL import Image, ImageDraw, ImageFont
SRC = sys.argv[1] if len(sys.argv) > 1 else "wm.png"
W, PITCH, SSF = 960, 7, 4
INK = (11, 18, 32)
random.seed(4)
m = Image.open(SRC).convert("L")
cols = W // PITCH
H = round(W * m.height / m.width)
rows = H // PITCH
cov = m.resize((cols * 3, rows * 3), Image.LANCZOS).resize((cols, rows), Image.BOX)
PADY, LABSH = 14, 34
CH = rows * PITCH + 2 * PADY + LABSH
img = Image.new("RGB", (W * SSF, CH * SSF), "white")
d = ImageDraw.Draw(img)
def diamond(cx, cy, r):
    cx, cy, r = cx * SSF, cy * SSF, r * SSF
    d.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], fill=INK)
for j in range(rows):
    for i in range(cols):
        a = 1 - cov.getpixel((i, j)) / 255
        if a > 0.04:
            diamond(i * PITCH + PITCH / 2, PADY + j * PITCH + PITCH / 2, PITCH * 0.5 * min(1, a ** 0.8))
        elif random.random() < 0.004:           # faint stray specks like the site
            diamond(i * PITCH + PITCH / 2, PADY + j * PITCH + PITCH / 2, 0.6)
img = img.resize((W, CH), Image.LANCZOS)
d = ImageDraw.Draw(img)
f = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
txt = "L   A   B   S"
tw = d.textlength(txt, font=f)
d.text(((W - tw) / 2 + 0, PADY + rows * PITCH + 10), txt, font=f, fill=(90, 100, 118))
img.save("public/signature-wordmark.png")
print(img.size)
