"""Inspect the character turnaround sheet: size, background colour, figure bounds."""

from PIL import Image
import numpy as np

SRC = r"F:\项目文件夹\2026提升包\个人网页制作\个人IP形象\02_创作小狗\三视图.png"

im = Image.open(SRC).convert("RGB")
w, h = im.size
print("size:", w, h)

a = np.asarray(im).astype(np.int16)
luma = a.mean(axis=2)

# background probe: sample a clean column between the figures
probe_left = int(w * 0.33)
probe_right = int(w * 0.335)
bg_col = luma[:, probe_left:probe_right]
print("bg column mean:", bg_col.mean(), "min", bg_col.min(), "max", bg_col.max())

rows = [int(h * f) for f in (0.2, 0.4, 0.6, 0.8)]
for r in rows:
    print(f"  row {r}: bg={luma[r, probe_left:probe_right].mean():.1f}")

# figure region columns (halves) referenced from the layout: three views
for name, x0f, x1f in (("front", 0.06, 0.30), ("side", 0.33, 0.60), ("back", 0.68, 0.93)):
    x0, x1 = int(w * x0f), int(w * x1f)
    sub = luma[int(h * 0.10):int(h * 0.88), x0:x1]
    bg = np.median(sub)
    diff = np.abs(sub - bg)
    mask = diff > 18
    ys, xs = np.nonzero(mask)
    if len(xs) == 0:
        print(name, "no mask")
        continue
    print(
        name,
        "bg~%.1f" % bg,
        "x:", x0 + xs.min(), x0 + xs.max(),
        "y:", int(h * 0.10) + ys.min(), int(h * 0.10) + ys.max(),
        "cover %.3f" % (mask.mean(),),
    )

# how bright is the fur vs the background
front = luma[200:700, int(w * 0.12):int(w * 0.28)]
p = np.percentile(front, [50, 90, 99])
print("front region luma percentiles 50/90/99:", p)
