"""Static, never-expiring branded QR -> PNG + SVG. Usage: python make_qr.py [url]
Needs: pip install segno pillow"""
import sys, io, base64, segno
from PIL import Image, ImageDraw

URL = sys.argv[1] if len(sys.argv) > 1 else "https://arcscalelabs.com"
LOGO = "logo-black.png"
OUT = "arcscale-labs-qr"
INK = "#0b1220"          # near-black navy
S = 40                   # px per module in the final PNG
SS = 3                   # supersampling factor (smooth, seam-free edges)
QUIET = 4
DOT = 0.92               # dot diameter as a fraction of a module (bigger = more solid in print)

qr = segno.make(URL, error="h")
m = [[bool(c) for c in row] for row in qr.matrix]
n = len(m)
total = n + 2 * QUIET    # canvas size in modules

def in_finder(r, c):
    return (r < 7 and c < 7) or (r < 7 and c >= n - 7) or (r >= n - 7 and c < 7)

# logo: keep its own transparency, crop to the arcs
logo = Image.open(LOGO).convert("RGBA")
logo = logo.crop(logo.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox())
LW = n * 0.30                                  # logo width in modules
LH = LW * logo.height / logo.width
mid = n / 2
clear_w, clear_h = LW / 2 + 1, LH / 2 + 1      # half-extents of the cleared area

# shapes in module units: ("dot", cx, cy, d) / ("rrect", x, y, w, radius, fill)
shapes = []
for r in range(n):
    for c in range(n):
        if not m[r][c] or in_finder(r, c):
            continue
        if abs(r + .5 - mid) < clear_h and abs(c + .5 - mid) < clear_w:
            continue
        shapes.append(("dot", c + QUIET + .5, r + QUIET + .5, DOT))
for r0, c0 in [(0, 0), (0, n - 7), (n - 7, 0)]:
    x, y = c0 + QUIET, r0 + QUIET
    shapes += [("rrect", x, y, 7, 2.2, INK),
               ("rrect", x + 1, y + 1, 5, 1.4, "#ffffff"),
               ("rrect", x + 2, y + 2, 3, 0.9, INK)]

lx, ly = (total - LW) / 2, (total - LH) / 2

# ---- PNG ----
px = S * SS
img = Image.new("RGB", (total * px, total * px), "white")
d = ImageDraw.Draw(img)
for s in shapes:
    if s[0] == "dot":
        _, cx, cy, dia = s
        d.ellipse([(cx - dia / 2) * px, (cy - dia / 2) * px, (cx + dia / 2) * px, (cy + dia / 2) * px], fill=INK)
    else:
        _, x, y, w, rad, fill = s
        d.rounded_rectangle([x * px, y * px, (x + w) * px - 1, (y + w) * px - 1], radius=rad * px, fill=fill)
lg = logo.resize((int(LW * px), int(LW * px * logo.height / logo.width)), Image.LANCZOS)
img.paste(lg, (int(lx * px), int(ly * px)), lg)
img = img.resize((total * S, total * S), Image.LANCZOS)
img.save(OUT + ".png", dpi=(600, 600))

# ---- SVG (vector, for print) ----
buf = io.BytesIO(); logo.save(buf, "PNG")
b64 = base64.b64encode(buf.getvalue()).decode()
parts = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {total} {total}" width="{total * S}" height="{total * S}">',
         f'<rect width="{total}" height="{total}" fill="#fff"/>']
for s in shapes:
    if s[0] == "dot":
        parts.append(f'<circle cx="{s[1]}" cy="{s[2]}" r="{s[3] / 2}" fill="{INK}"/>')
    else:
        _, x, y, w, rad, fill = s
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{w}" rx="{rad}" fill="{fill}"/>')
parts.append(f'<image x="{lx}" y="{ly}" width="{LW}" height="{LH}" xlink:href="data:image/png;base64,{b64}"/>')
parts.append('</svg>')
open(OUT + ".svg", "w").write("\n".join(parts))
print("saved", OUT + ".png / .svg", img.size, "modules:", n)
