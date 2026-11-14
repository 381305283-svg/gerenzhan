"""Cut the CE mascot out of the light-grey turnaround sheet and preview it on dark berry."""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SRC = Path(r"F:\项目文件夹\2026提升包\个人网页制作\个人IP形象\02_创作小狗\三视图.png")
OUT = Path(r"F:\项目文件夹\2026提升包\个人网页制作\codex\scripts\_preview")
OUT.mkdir(parents=True, exist_ok=True)

BG_DARK = (11, 5, 10)

# keep the figures, drop the sheet header, the swatch column and the captions
REGIONS = {
    "front": (118, 96, 516, 814),
    "side": (536, 96, 1014, 814),
    "back": (1120, 96, 1566, 814),
}


def background_field(luma: np.ndarray, size: int = 24) -> np.ndarray:
    """Coarse sheet-colour field: median of the paper-toned pixels in each block."""
    h, w = luma.shape
    gh, gw = h // size, w // size
    grid = np.full((gh, gw), np.nan, np.float32)
    for gy in range(gh):
        for gx in range(gw):
            blk = luma[gy * size : (gy + 1) * size, gx * size : (gx + 1) * size]
            band = blk[(blk > 208) & (blk < 250)]
            if band.size > 10:
                grid[gy, gx] = np.median(band)
    if np.isnan(grid).any():
        grid[np.isnan(grid)] = np.nan if False else np.nanmedian(grid)
        for _ in range(80):
            pad = np.pad(grid, 1, mode="edge")
            avg = (pad[:-2, 1:-1] + pad[2:, 1:-1] + pad[1:-1, :-2] + pad[1:-1, 2:]) / 4.0
            grid = grid * 0.4 + avg * 0.6
    up = np.repeat(np.repeat(grid, size, axis=0), size, axis=1)
    up = np.pad(up, ((0, max(0, h - up.shape[0])), (0, max(0, w - up.shape[1]))), mode="edge")
    return box_blur(up[:h, :w].astype(np.float32), 10)


def box_blur(values: np.ndarray, radius: int) -> np.ndarray:
    """Separable box blur, so we do not need scipy."""
    pad = np.pad(values, radius, mode="edge")
    csum = np.cumsum(pad, axis=0)
    csum = np.vstack([np.zeros((1, csum.shape[1]), np.float32), csum])
    out = (csum[2 * radius + 1 :] - csum[: -2 * radius - 1]) / (2 * radius + 1)
    csum = np.cumsum(out, axis=1)
    csum = np.hstack([np.zeros((csum.shape[0], 1), np.float32), csum])
    return (csum[:, 2 * radius + 1 :] - csum[:, : -2 * radius - 1]) / (2 * radius + 1)


def fill_holes(mask: np.ndarray) -> np.ndarray:
    """Flood the outside of a boolean mask, then treat everything unreached as inside."""
    h, w = mask.shape
    outside = np.zeros((h, w), bool)
    stack = []
    for x in range(w):
        stack.append((0, x))
        stack.append((h - 1, x))
    for y in range(h):
        stack.append((y, 0))
        stack.append((y, w - 1))
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= h or x >= w or outside[y, x] or mask[y, x]:
            continue
        outside[y, x] = True
        stack.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
    return ~outside


def cut(name: str) -> Image.Image:
    im = Image.open(SRC).convert("RGB").crop(REGIONS[name])
    rgb = np.asarray(im).astype(np.float32)
    luma = rgb.mean(axis=2)
    bg = background_field(luma)
    diff = luma - bg
    sat = rgb.max(axis=2) - rgb.min(axis=2)

    # anything clearly off the sheet colour: clothes/outlines (darker) and fur (brighter)
    strong = (diff > 3.6) | (diff < -13.0) | (sat > 14)
    m = Image.fromarray((strong * 255).astype(np.uint8), mode="L")
    # opening kills the 1-2px grid + dashed guide lines, closing re-unites fur strands
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    m = m.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(5))
    binary = np.asarray(m) > 110
    solid = drop_paper_blocks(keep_main_blob(binary), diff)

    shape = np.asarray(
        Image.fromarray((solid * 255).astype(np.uint8), mode="L").filter(
            ImageFilter.GaussianBlur(1.1)
        ),
        dtype=np.float32,
    ) / 255.0
    alpha = np.clip(shape, 0, 1) * 255.0
    alpha = np.asarray(
        Image.fromarray(alpha.astype(np.uint8), mode="L").filter(ImageFilter.GaussianBlur(0.5)),
        dtype=np.float32,
    )

    a = (alpha / 255.0)[..., None]
    # un-blend the sheet colour out of the soft edges so no light halo survives
    safe = np.clip(a, 0.12, 1.0)
    unmixed = np.clip((rgb - (1.0 - safe) * bg[..., None]) / safe, 0, 255)
    colour = np.where(a > 0.02, unmixed, rgb)

    out = Image.fromarray(np.dstack([colour, alpha]).astype(np.uint8), mode="RGBA")
    bbox = out.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    return out.crop(bbox)


def keep_main_blob(mask: np.ndarray) -> np.ndarray:
    """Drop specks and leftover guide-line fragments; keep the character."""
    h, w = mask.shape
    seen = np.zeros((h, w), bool)
    blobs = []
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
                seen[y, x] = True
                for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        stack.append((ny, nx))
            blobs.append((len(cells), cells))
    if not blobs:
        return mask
    blobs.sort(key=lambda b: b[0], reverse=True)
    floor = max(400, blobs[0][0] * 0.03)
    keep = np.zeros((h, w), bool)
    for size, cells in blobs:
        if size < floor:
            continue
        idx = np.array(cells)
        keep[idx[:, 0], idx[:, 1]] = True
    return keep


def drop_paper_blocks(mask: np.ndarray, diff: np.ndarray, min_area: int = 700) -> np.ndarray:
    """Delete large flat paper-coloured components that survived inside the silhouette."""
    paper = np.abs(diff) < 3.0
    h, w = mask.shape
    seen = np.zeros((h, w), bool)
    out = mask.copy()
    for sy in range(h):
        for sx in range(w):
            if not paper[sy, sx] or seen[sy, sx]:
                continue
            stack = [(sy, sx)]
            seen[sy, sx] = True
            cells = []
            while stack:
                y, x = stack.pop()
                cells.append((y, x))
                for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= ny < h and 0 <= nx < w and paper[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
            if len(cells) >= min_area:
                idx = np.array(cells)
                out[idx[:, 0], idx[:, 1]] = False
    return out


def preview(img: Image.Image, path: Path, scale: float = 0.55, glow: bool = True) -> None:
    w, h = int(img.width * scale), int(img.height * scale)
    fig = img.resize((w, h), Image.LANCZOS)
    canvas = Image.new("RGB", (w + 200, h + 200), BG_DARK)
    if not glow:
        canvas.paste(fig, (100, 100), fig)
        canvas.save(path)
        return
    glow = Image.new("RGB", canvas.size, (0, 0, 0))
    glow.paste(fig, (100, 100), fig)
    glow = glow.filter(ImageFilter.GaussianBlur(38)).point(lambda v: min(255, int(v * 1.35)))
    canvas = Image.blend(canvas, glow, 0.55)
    canvas.paste(fig, (100, 100), fig)
    canvas.save(path)


if __name__ == "__main__":
    for key in REGIONS:
        sprite = cut(key)
        sprite.save(OUT / f"char-{key}.png")
        preview(sprite, OUT / f"preview-{key}.png")
        preview(sprite, OUT / f"raw-{key}.png", glow=False, scale=0.9)
        print(key, sprite.size)
