from collections import deque
from PIL import Image, ImageFilter
import sys

src = sys.argv[1]
dst = sys.argv[2]

im = Image.open(src).convert("RGBA")
w, h = im.size
px = im.load()

def is_white(x, y):
    r, g, b, a = px[x, y]
    return r > 235 and g > 235 and b > 235

visited = bytearray(w * h)
q = deque()

def push(x, y):
    if 0 <= x < w and 0 <= y < h and not visited[y * w + x] and is_white(x, y):
        visited[y * w + x] = 1
        q.append((x, y))

for x in range(w):
    push(x, 0)
    push(x, h - 1)
for y in range(h):
    push(0, y)
    push(w - 1, y)

while q:
    x, y = q.popleft()
    r, g, b, a = px[x, y]
    px[x, y] = (r, g, b, 0)
    push(x + 1, y)
    push(x - 1, y)
    push(x, y + 1)
    push(x, y - 1)

alpha = im.split()[3]
halo_mask = alpha.filter(ImageFilter.MaxFilter(31))
halo = Image.new("RGBA", (w, h), (255, 255, 255, 0))
halo.putalpha(halo_mask)

out = Image.alpha_composite(halo, im)

bbox = out.split()[3].getbbox()
if bbox:
    out = out.crop(bbox)

out.save(dst)
print("saved", dst, out.size)
