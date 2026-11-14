"""Generate the procedural assets: character crops, the hero video frames and the
blackberry placeholder covers.

The works covers here are the original placeholders written as work-0N.png. The
live site now shows the real stills (work-0N.jpg) imported by import_works.py, so
running `python scripts/gen_media.py works` only regenerates the unused placeholders.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC_IP = Path(r"F:\项目文件夹\2026提升包\个人网页制作\个人IP形象\02_创作小狗\三视图.png")
ROOT = Path(r"F:\项目文件夹\2026提升包\个人网页制作\codex")
MEDIA = ROOT / "public" / "media"
WORKS = MEDIA / "works"
FFMPEG = Path(
    r"D:\FFmpeg\ffmpeg-2025-12-04-git-d6458f6a8b-full_build\bin\ffmpeg.exe"
)
FRAMES = ROOT / "scripts" / "_frames"

INK = (10, 5, 10)
PLUM = (42, 10, 34)
BERRY = (86, 12, 62)
PINK = (255, 61, 166)
WHITE = (245, 238, 243)


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


# --------------------------------------------------------------------------- hero


def hero_frame(t: float, w: int = 1920, h: int = 1080) -> Image.Image:
    """One frame of the seamless dark-berry background loop (t goes 0 -> 1)."""
    sw, sh = 240, 135
    yy, xx = np.mgrid[0:sh, 0:sw].astype(np.float32)
    x = xx / sw
    y = yy / sh
    frame = np.zeros((sh, sw, 3), np.float32)
    frame[:] = INK

    blobs = (
        (0.24, 0.32, 0.55, 0.30, (52, 10, 42), 0.55, 0.0),
        (0.74, 0.42, 0.46, 0.26, (66, 12, 50), 0.62, 0.35),
        (0.52, 0.86, 0.62, 0.30, (30, 6, 26), 0.5, 0.66),
        (0.87, 0.19, 0.26, 0.17, (108, 18, 74), 0.5, 0.2),
        (0.11, 0.79, 0.30, 0.22, (78, 14, 60), 0.42, 0.5),
    )
    for cx, cy, rx, ry, colour, strength, phase in blobs:
        px = cx + 0.045 * np.sin(2 * np.pi * (t + phase))
        py = cy + 0.035 * np.cos(2 * np.pi * (t + phase * 1.3))
        d = ((x - px) / rx) ** 2 + ((y - py) / ry) ** 2
        falloff = np.exp(-d * 1.9) * strength
        frame += falloff[..., None] * np.array(colour, np.float32)

    # slow scan lines + drifting hairline grid, kept very low contrast
    grid = np.zeros((sh, sw), np.float32)
    for step in (0.25, 0.5, 0.75):
        offset = (t * 0.12) % 1.0
        grid += np.exp(-(((x - ((step + offset) % 1.0)) * sw / 1.4) ** 2))
    for step in (0.333, 0.667):
        offset = (t * 0.08) % 1.0
        grid += np.exp(-(((y - ((step + offset) % 1.0)) * sh / 1.2) ** 2))
    frame += grid[..., None] * np.array((26, 7, 22), np.float32)

    # a soft magenta light leak that breathes once per loop
    leak = np.exp(-(((x - 0.62) ** 2 + (y - 1.02) ** 2) / 0.16)) * (0.5 + 0.5 * np.sin(2 * np.pi * t))
    frame += leak[..., None] * np.array((74, 14, 58), np.float32)

    img = Image.fromarray(np.clip(frame, 0, 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    img = img.filter(ImageFilter.GaussianBlur(14))

    # vignette + film grain
    arr = np.asarray(img).astype(np.float32)
    gx = np.linspace(-1, 1, w, dtype=np.float32)
    gy = np.linspace(-1, 1, h, dtype=np.float32)
    r = np.sqrt((gx[None, :] * 0.92) ** 2 + (gy[:, None]) ** 2)
    arr *= np.clip(1.04 - 0.78 * r**1.5, 0.08, 1.1)[..., None]
    rng = np.random.default_rng(int(t * 4096))
    arr += rng.normal(0, 3.4, arr.shape).astype(np.float32)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def build_hero(fps: int = 25, seconds: int = 8) -> None:
    FRAMES.mkdir(parents=True, exist_ok=True)
    for i in range(fps * seconds):
        hero_frame(i / (fps * seconds)).save(FRAMES / f"hero_{i:04d}.jpg", quality=90)
    poster = hero_frame(0.0)
    poster.save(MEDIA / "hero-poster.jpg", quality=88)
    print("frames:", fps * seconds)


# --------------------------------------------------------------------------- works


def font(size: int, bold: bool = False):
    candidates = [
        r"C:\Windows\Fonts\Inter-SemiBold.ttf" if bold else r"C:\Windows\Fonts\Inter-Medium.ttf",
        r"C:\Windows\Fonts\msyhbd.ttc",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def gradient(w: int, h: int, a=INK, b=PLUM, angle: float = 0.6) -> Image.Image:
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    x = xx / w
    y = yy / h
    t = np.clip((x * np.cos(angle) + y * np.sin(angle)), 0, 1)
    arr = np.array(a, np.float32)[None, None, :] * (1 - t[..., None]) + np.array(
        b, np.float32
    )[None, None, :] * t[..., None]
    return Image.fromarray(arr.astype(np.uint8))


def add_grain(img: Image.Image, amount: float = 4.0) -> Image.Image:
    arr = np.asarray(img).astype(np.float32)
    rng = np.random.default_rng(7)
    arr += rng.normal(0, amount, arr.shape).astype(np.float32)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def vignette(img: Image.Image, strength: float = 0.55) -> Image.Image:
    w, h = img.size
    gx = np.linspace(-1, 1, w, dtype=np.float32)
    gy = np.linspace(-1, 1, h, dtype=np.float32)
    r = np.sqrt((gx[None, :] * 0.9) ** 2 + gy[:, None] ** 2)
    arr = np.asarray(img).astype(np.float32) * np.clip(1.1 - strength * r**1.9, 0.1, 1.2)[
        ..., None
    ]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def work_cover(kind: str, index: int, w: int = 1600, h: int = 1000) -> Image.Image:
    base = gradient(w, h, INK, lerp(PLUM, BERRY, (index % 3) / 2), angle=0.4 + 0.2 * index)
    layer = Image.new("RGB", (w, h), (0, 0, 0))
    d = ImageDraw.Draw(layer)

    if kind == "film":  # 版本宣传片
        for i in range(4):
            x = 150 + i * 330
            d.rounded_rectangle([x, 300, x + 250, 700], 18, outline=PINK, width=3)
            d.rounded_rectangle([x + 22, 322, x + 228, 678], 12, fill=(22, 8, 20))
        d.line([150, 470, 1418, 470], fill=(255, 61, 166), width=2)
    elif kind == "stage":  # 音乐节投屏
        for i in range(28):
            x = 120 + i * 50
            height = 120 + int(240 * abs(np.sin(i * 0.7)))
            d.rectangle([x, 620 - height, x + 14, 620], fill=lerp(PINK, BERRY, i / 28))
        d.ellipse([1120, 180, 1480, 540], outline=PINK, width=4)
        d.ellipse([1190, 250, 1410, 470], outline=(255, 120, 190), width=2)
    elif kind == "estate":  # 地产月服
        for i in range(5):
            d.rectangle([180 + i * 250, 420 - i * 34, 380 + i * 250, 780], outline=(214, 196, 210))
        d.polygon([(180, 420), (560, 250), (940, 420)], outline=PINK)
    elif kind == "game":  # 游戏商单
        for i in range(6):
            r = 90 + i * 62
            d.arc([800 - r, 500 - r, 800 + r, 500 + r], 200 + i * 8, 340 - i * 8, fill=lerp(PINK, WHITE, i / 8), width=3)
        d.rounded_rectangle([180, 700, 1420, 780], 12, outline=(255, 61, 166), width=2)
        for i in range(24):
            hh = 10 + int(52 * abs(np.sin(i * 0.9)))
            d.rectangle([240 + i * 46, 780 - hh, 262 + i * 46, 780], fill=(255, 61, 166))
    elif kind == "mg":  # MG 动画
        for i in range(7):
            x = 170 + i * 190
            d.rounded_rectangle([x, 330 + (i % 3) * 120, x + 130, 460 + (i % 3) * 120], 20,
                                outline=lerp(PINK, WHITE, i / 7), width=3)
        d.line([150, 620, 1450, 620], fill=(255, 61, 166), width=2)
        d.ellipse([1240, 200, 1330, 290], outline=PINK, width=3)
    else:  # ai workflow
        for i in range(9):
            x = 200 + (i % 3) * 420
            y = 230 + (i // 3) * 250
            d.rounded_rectangle([x, y, x + 300, y + 160], 16, outline=(255, 61, 166), width=2)
            d.rounded_rectangle([x + 26, y + 26, x + 274, y + 134], 10, fill=(20, 7, 18))
        for i in range(4):
            d.line([520 + i * 420, 390, 620 + i * 420, 480], fill=(255, 61, 166), width=2)

    layer = layer.filter(ImageFilter.GaussianBlur(0.6))
    out = Image.blend(base, Image.blend(base, layer, 0.75), 0.62)
    return add_grain(vignette(out, 0.5), 3.2)


def build_works() -> None:
    WORKS.mkdir(parents=True, exist_ok=True)
    kinds = ["film", "stage", "estate", "game", "mg", "ai"]
    for i, kind in enumerate(kinds):
        work_cover(kind, i).save(WORKS / f"work-{i + 1:02d}.png")
    print("works:", len(kinds))


# ----------------------------------------------------------------------- character


def build_character() -> None:
    sheet = Image.open(SRC_IP).convert("RGB")
    front = sheet.crop((112, 90, 522, 816))
    front = front.resize((front.width * 2, front.height * 2), Image.LANCZOS)
    front.save(MEDIA / "character-front.png")
    head = sheet.crop((130, 108, 500, 400))
    head = head.resize((head.width * 2, head.height * 2), Image.LANCZOS)
    head.save(MEDIA / "character-head.png")
    sheet.save(MEDIA / "character-sheet.png")
    print("character done", front.size, head.size, sheet.size)


if __name__ == "__main__":
    import sys

    MEDIA.mkdir(parents=True, exist_ok=True)
    wanted = sys.argv[1:] or ["works", "character", "hero"]
    if "works" in wanted:
        build_works()
    if "character" in wanted:
        build_character()
    if "hero" in wanted:
        build_hero()
    print("assets ready:", ", ".join(wanted))
