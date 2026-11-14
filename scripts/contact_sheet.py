"""Downscale scripts/shots/00-full.png so the whole page fits in one review image."""

from pathlib import Path

from PIL import Image

SHOTS = Path(__file__).parent / "shots"
src = SHOTS / "00-full.png"

im = Image.open(src)
scale = 700 / im.width
overview = im.resize((700, int(im.height * scale)), Image.LANCZOS)
overview.save(SHOTS / "00-overview.png")

# plus three legible slices
slice_h = im.height // 3
for i in range(3):
    box = (0, i * slice_h, im.width, min(im.height, (i + 1) * slice_h))
    part = im.crop(box)
    part.thumbnail((980, 10000), Image.LANCZOS)
    part.save(SHOTS / f"00-part{i + 1}.png")

print("overview", overview.size)
