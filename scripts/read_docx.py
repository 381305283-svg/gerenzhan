"""Dump a .docx body text (paragraphs + tables) and list embedded media."""

import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def dump(path: Path) -> None:
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        media = [n for n in names if n.startswith("word/media/")]
        print("=== MEDIA ===")
        for name in media:
            info = z.getinfo(name)
            print(f"{name}  {info.file_size} bytes")

        root = ET.fromstring(z.read("word/document.xml"))
        body = root.find(W + "body")
        print("=== TEXT ===")
        for child in body:
            tag = child.tag.replace(W, "")
            if tag == "p":
                text = "".join(t.text or "" for t in child.iter(W + "t")).strip()
                drawings = child.findall(f".//{W}drawing")
                blips = [
                    b.get("{http://schemas.openxmlformats.org/drawingml/2006/main}embed")
                    for b in child.iter(
                        "{http://schemas.openxmlformats.org/drawingml/2006/main}blip"
                    )
                ]
                marker = f"  [图片 x{len(drawings)}]" if drawings else ""
                if text or marker:
                    print(("P: " + text if text else "P:") + marker)
                if blips:
                    print("   blips:", blips)
            elif tag == "tbl":
                print("--- TABLE ---")
                for row in child.iter(W + "tr"):
                    cells = [
                        "".join(t.text or "" for t in cell.iter(W + "t")).strip()
                        for cell in row.findall(W + "tc")
                    ]
                    print(" | ".join(cells))
                print("--- /TABLE ---")

        if "word/_rels/document.xml.rels" in names:
            rels = ET.fromstring(z.read("word/_rels/document.xml.rels"))
            print("=== RELS ===")
            for rel in rels:
                if "image" in rel.get("Type", ""):
                    print(rel.get("Id"), "->", rel.get("Target"))


if __name__ == "__main__":
    dump(Path(sys.argv[1]))
