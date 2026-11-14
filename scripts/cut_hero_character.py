"""Cut the CE mascot out of the turnaround sheet for the hero.

White fur on light grey paper sits only ~10 luma apart, so a plain threshold eats
the fur. Instead: model the paper as a smooth field, threshold against it, then
delete the large flat paper patches that survive inside the silhouette while
keeping the (textured) fur.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SRC = Path(r"F:\项目文件夹\2026提升包\个人网页制作\个人IP形象\02_创作小狗\三视图.png")
OUT = Path(r"F:\项目文件夹\2026提升包\个人网页制作\codex\public\media")
PREVIEW = Path(r"F:\项目文件夹\2026提升包\个人网页制作\codex\scripts\_preview")

REGION = (112, 92, 522, 816)  # front view, no sheet header, no caption
SCALE = 2.0


def background_field(luma: np.ndarray, size: int = 24) -> np.ndarray:
    h, w = luma.shape
    gh, gw = h // size, w // size
    grid = np.full((gh, gw), np.nan, np.float32)
    for gy in range(gh):
        for gx in range(gw):
            blk = luma[gy * size : (gy + 1) * size, gx * size : (gx + 1) * size]
            band = blk[(blk > 208) & (blk < 252)]
            if band.size > 10:
                grid[gy, gx] = np.median(band)
    grid[np.isnan(grid)] = np.nanmedian(grid)
    for _ in range(80):
        pad = np.pad(grid, 1, mode="edge")
        avg = (pad[:-2, 1:-1] + pad[2:, 1:-1] + pad[1:-1, :-2] + pad[1:-1, 2:]) / 4.0
        grid = grid * 0.4 + avg * 0.6
    up = np.repeat(np.repeat(grid, size, axis=0), size, axis=1)
    up = np.pad(up, ((0, max(0, luma.shape[0] - up.shape[0])), (0, max(0, luma.shape[1] - up.shape[1]))), mode="edge")
    return box_blur(up[: luma.shape[0], : luma.shape[1]].astype(np.float32), 10)


def box_blur(values: np.ndarray, radius: int) -> np.ndarray:
    pad = np.pad(values, radius, mode="edge")
    csum = np.cumsum(pad, axis=0)
    csum = np.vstack([np.zeros((1, csum.shape[1]), np.float32), csum])
    out = (csum[2 * radius + 1 :] - csum[: -2 * radius - 1]) / (2 * radius + 1)
    csum = np.cumsum(out, axis=1)
    csum = np.hstack([np.zeros((csum.shape[0], 1), np.float32), csum])
    return (csum[:, 2 * radius + 1 :] - csum[:, : -2 * radius - 1]) / (2 * radius + 1)


def components(mask: np.ndarray):
    h, w = mask.shape
    seen = np.zeros((h, w), bool)
    out = []
    for sy in range(h):
        for sx in range(w):
            if not mask[sy, sx] or seen[sy, sx]:
                continue
            stack = [(sy, sx)]
            seen[sy, sx] = True
            cells = []
            while stack:
                y, x = stack.pop()
                cells.append((y, x))
                for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
            out.append(cells)
    return out


def fill_holes(mask: np.ndarray) -> np.ndarray:
    h, w = mask.shape
    inside = np.zeros((h, w), bool)
    stack = [(y, x) for x in range(w) for y in (0, h - 1)]
    stack += [(y, x) for y in range(h) for x in (0, w - 1)]
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= h or x >= w or inside[y, x] or mask[y, x]:
            continue
        inside[y, x] = True
        stack.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
    return ~inside


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)

    rgb = np.asarray(Image.open(SRC).convert("RGB").crop(REGION)).astype(np.float32)
    luma = rgb.mean(axis=2)
    bg = background_field(luma)
    diff = luma - bg
    sat = rgb.max(axis=2) - rgb.min(axis=2)

    strong = (diff > 3.6) | (diff < -13.0) | (sat > 14)
    mask_img = Image.fromarray((strong * 255).astype(np.uint8), mode="L")
    mask_img = mask_img.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    mask_img = mask_img.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(5))
    solid = np.asarray(mask_img) > 110
    solid = fill_holes(solid)

    # keep the biggest blob (the mascot) and any sizeable companion blobs
    blobs = sorted(components(solid), key=len, reverse=True)
    keep = np.zeros_like(solid)
    for cells in blobs[:3]:
        if len(cells) < max(400, len(blobs[0]) * 0.03):
            continue
        idx = np.array(cells)
        keep[idx[:, 0], idx[:, 1]] = True

    # sheet paper that survived inside the silhouette is large, flat and sits on the
    # paper level; the fur is textured, so texture spread tells them apart
    texture = np.asarray(
        Image.fromarray(luma.astype(np.uint8), mode="L").filter(ImageFilter.GaussianBlur(1.4)),
        dtype=np.float32,
    )
    texture = np.abs(luma - texture)
    paper = np.abs(diff) < 4.0
    removed = 0
    for cells in components(keep & paper):
        if len(cells) < 900:
            continue
        idx = np.array(cells)
        if texture[idx[:, 0], idx[:, 1]].mean() < 2.2:
            keep[idx[:, 0], idx[:, 1]] = False
            removed += 1

    alpha = np.asarray(
        Image.fromarray((keep * 255).astype(np.uint8), mode="L").filter(
            ImageFilter.GaussianBlur(1.2)
        ),
        dtype=np.float32,
    )
    a = (alpha / 255.0)[..., None]
    safe = np.clip(a, 0.15, 1.0)
    unmixed = np.clip((rgb - (1.0 - safe) * bg[..., None]) / safe, 0, 255)
    colour = np.where(a > 0.02, unmixed, rgb)

    out = Image.fromarray(np.dstack([colour, alpha]).astype(np.uint8), mode="RGBA")
    bbox = out.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    out = out.crop(bbox)
    out = out.resize((int(out.width * SCALE), int(out.height * SCALE)), Image.LANCZOS)
    out.save(OUT / "hero-character.png")
    print("removed paper patches:", removed, "size:", out.size)

    # preview on the hero's berry backdrop
    w, h = out.width, out.height
    canvas = Image.new("RGB", (w + 240, h + 200), (12, 6, 12))
    canvas.paste(out, (120, 120), out)
    canvas.resize((canvas.width // 2, canvas.height // 2), Image.LANCZOS).save(
        PREVIEW / "hero-character-check.png"
    )


if __name__ == "__main__":
    main()
