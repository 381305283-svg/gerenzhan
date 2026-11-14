"""Extract embedded images from a .docx into a folder."""

import sys
import zipfile
from pathlib import Path

from PIL import Image

src = Path(sys.argv[1])
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(src) as z:
    for name in z.namelist():
        if not name.startswith("word/media/"):
            continue
        data = z.read(name)
        if not data:
            continue
        target = out / Path(name).name
        target.write_bytes(data)
        with Image.open(target) as im:
            print(f"{target.name}\t{im.size[0]}x{im.size[1]}\t{im.mode}\t{len(data)} bytes")
