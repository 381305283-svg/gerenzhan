"""How far does the white fur sit from the sheet colour, in luma terms?"""

from pathlib import Path
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from cut_character import REGIONS, background_field  # noqa: E402

SRC = Path(r"F:\项目文件夹\2026提升包\个人网页制作\个人IP形象\02_创作小狗\三视图.png")

im = Image.open(SRC).convert("RGB").crop(REGIONS["front"])
rgb = np.asarray(im).astype(np.float32)
luma = rgb.mean(axis=2)
bg = background_field(luma)
diff = luma - bg

h, w = luma.shape
head = diff[int(h * 0.10) : int(h * 0.28), int(w * 0.25) : int(w * 0.75)]
print("head region diff percentiles:", np.percentile(head, [1, 5, 25, 50, 75, 90, 99]).round(1))
air = diff[int(h * 0.02) : int(h * 0.08), int(w * 0.3) : int(w * 0.7)]
print("clean bg diff percentiles:", np.percentile(air, [1, 5, 50, 95, 99]).round(1))
tail = diff[int(h * 0.45) : int(h * 0.62), int(w * 0.72) : int(w * 0.98)]
print("tail diff percentiles:", np.percentile(tail, [5, 25, 50, 75, 95]).round(1))
print("fraction of head pixels with diff<3:", float((head < 3).mean()).__round__(3))
