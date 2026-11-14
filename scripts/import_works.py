"""Import the stills from 代表作品.docx into public/media/works/.

The document lists six works, each followed by its picture, so the images are
written out in document order as work-01 … work-06.
"""

import io
import zipfile
from pathlib import Path

from PIL import Image

DOCX = Path(r"F:\项目文件夹\2026提升包\作品整理\简历更新\代表作品.docx")
OUT = Path(r"F:\项目文件夹\2026提升包\个人网页制作\codex\public\media\works")

TARGET_WIDTH = 1600


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(DOCX) as z:
        names = sorted(
            (n for n in z.namelist() if n.startswith("word/media/") and z.getinfo(n).file_size),
            key=lambda n: int("".join(ch for ch in Path(n).stem if ch.isdigit()) or 0),
        )
        for index, name in enumerate(names, start=1):
            image = Image.open(io.BytesIO(z.read(name))).convert("RGB")
            if image.width < TARGET_WIDTH:
                scale = min(2.0, TARGET_WIDTH / image.width)
                image = image.resize(
                    (int(image.width * scale), int(image.height * scale)), Image.LANCZOS
                )
            elif image.width > TARGET_WIDTH:
                image = image.resize(
                    (TARGET_WIDTH, round(image.height * TARGET_WIDTH / image.width)),
                    Image.LANCZOS,
                )
            path = OUT / f"work-{index:02d}.jpg"
            image.save(path, quality=92, optimize=True, progressive=True)
            print(f"{path.name}\t{image.size[0]}x{image.size[1]}\t{path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
