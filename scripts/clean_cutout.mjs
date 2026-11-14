/**
 * Clean up the CE mascot cutout used by the hero.
 *
 * The original matte keeps splashes of the turnaround-sheet paper around the
 * character. Those leftovers hang off the body through thin bridges, so an
 * opening (erode -> keep largest blob -> grow back) removes them while keeping
 * the fur silhouette intact.
 *
 *   node scripts/clean_cutout.mjs <radius> [sourceFile] [outName]
 *
 * Writes a transparent PNG to scripts/_preview/<outName>.png plus a preview
 * composited on the site background colour.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const previewDir = join(here, "_preview");

const radius = Number(process.argv[2] ?? 14);
const srcFile = process.argv[3] ?? join(here, "..", "public", "media", "hero-character.png");
const outName = process.argv[4] ?? `clean-r${radius}`;
const srcBase64 = (await readFile(srcFile)).toString("base64");

const candidates = [
  process.env.CHROME_PATH,
  "C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe",
  "C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1217/chrome-win64/headless_shell.exe",
].filter(Boolean);

const executablePath = candidates.find((path) => existsSync(path));
if (!executablePath) {
  console.error("No Chromium found. Set CHROME_PATH to a browser executable.");
  process.exit(1);
}

await mkdir(previewDir, { recursive: true });

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage();

await page.goto("about:blank");

const result = await page.evaluate(
  async ({ base64, radius }) => {
    const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
    const blob = new Blob([bytes], { type: "image/png" });
    const bitmap = await createImageBitmap(blob);
    const { width: w, height: h } = bitmap;

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const img = ctx.getImageData(0, 0, w, h);
    const px = img.data;

    // 1. binary mask from the existing alpha
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i += 1) mask[i] = px[i * 4 + 3] > 32 ? 1 : 0;

    const morph = (src, r, want) => {
      // separable 1D sliding-window min/max, want=1 keeps the max (dilate)
      const tmp = new Uint8Array(w * h);
      const out = new Uint8Array(w * h);
      for (let y = 0; y < h; y += 1) {
        const row = y * w;
        for (let x = 0; x < w; x += 1) {
          let acc = src[row + x];
          for (let k = 1; k <= r; k += 1) {
            if (x - k >= 0) {
              const v = src[row + x - k];
              acc = want ? (v > acc ? v : acc) : v < acc ? v : acc;
            }
            if (x + k < w) {
              const v = src[row + x + k];
              acc = want ? (v > acc ? v : acc) : v < acc ? v : acc;
            }
          }
          tmp[row + x] = acc;
        }
      }
      for (let x = 0; x < w; x += 1) {
        for (let y = 0; y < h; y += 1) {
          const idx = y * w + x;
          let acc = tmp[idx];
          for (let k = 1; k <= r; k += 1) {
            if (y - k >= 0) {
              const v = tmp[idx - k * w];
              acc = want ? (v > acc ? v : acc) : v < acc ? v : acc;
            }
            if (y + k < h) {
              const v = tmp[idx + k * w];
              acc = want ? (v > acc ? v : acc) : v < acc ? v : acc;
            }
          }
          out[idx] = acc;
        }
      }
      return out;
    };

    const eroded = morph(mask, radius, 0);

    // 2. keep only the biggest blob of the eroded mask
    const label = new Int32Array(w * h).fill(-1);
    const stack = new Int32Array(w * h);
    let best = -1;
    let bestSize = 0;
    let current = 0;
    for (let start = 0; start < w * h; start += 1) {
      if (!eroded[start] || label[start] !== -1) continue;
      let sp = 0;
      stack[sp++] = start;
      label[start] = current;
      let size = 0;
      while (sp > 0) {
        const idx = stack[--sp];
        size += 1;
        const x = idx % w;
        const y = (idx - x) / w;
        if (x > 0 && eroded[idx - 1] && label[idx - 1] === -1) {
          label[idx - 1] = current;
          stack[sp++] = idx - 1;
        }
        if (x < w - 1 && eroded[idx + 1] && label[idx + 1] === -1) {
          label[idx + 1] = current;
          stack[sp++] = idx + 1;
        }
        if (y > 0 && eroded[idx - w] && label[idx - w] === -1) {
          label[idx - w] = current;
          stack[sp++] = idx - w;
        }
        if (y < h - 1 && eroded[idx + w] && label[idx + w] === -1) {
          label[idx + w] = current;
          stack[sp++] = idx + w;
        }
      }
      if (size > bestSize) {
        bestSize = size;
        best = current;
      }
      current += 1;
    }

    const core = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i += 1) core[i] = label[i] === best ? 1 : 0;

    // 3. grow back, stopping a few pixels short so the paper fringe is trimmed
    const grow = Math.max(1, radius - 5);
    const grown = morph(core, grow, 1);

    // 4. 3px box blur -> soft edge, multiplied into the original alpha
    const blur = (src, r) => {
      const tmp = new Float32Array(w * h);
      const out = new Float32Array(w * h);
      const win = 2 * r + 1;
      for (let y = 0; y < h; y += 1) {
        const row = y * w;
        let sum = 0;
        for (let x = -r; x <= r; x += 1) sum += src[row + Math.min(w - 1, Math.max(0, x))];
        for (let x = 0; x < w; x += 1) {
          tmp[row + x] = sum / win;
          const drop = src[row + Math.max(0, x - r)];
          const add = src[row + Math.min(w - 1, x + r + 1)];
          sum += add - drop;
        }
      }
      for (let x = 0; x < w; x += 1) {
        let sum = 0;
        for (let y = -r; y <= r; y += 1) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
        for (let y = 0; y < h; y += 1) {
          out[y * w + x] = sum / win;
          const drop = tmp[Math.max(0, y - r) * w + x];
          const add = tmp[Math.min(h - 1, y + r + 1) * w + x];
          sum += add - drop;
        }
      }
      return out;
    };

    const soft = blur(grown, 3);
    for (let i = 0; i < w * h; i += 1) {
      const a = px[i * 4 + 3] / 255;
      const m = Math.min(1, soft[i] * 1.35);
      px[i * 4 + 3] = Math.round(Math.max(0, Math.min(1, a * m)) * 255);
    }

    ctx.putImageData(img, 0, 0);

    const encode = async (target) => {
      const out = await target.convertToBlob({ type: "image/png" });
      const buf = new Uint8Array(await out.arrayBuffer());
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < buf.length; i += chunk) {
        binary += String.fromCharCode(...buf.subarray(i, i + chunk));
      }
      return btoa(binary);
    };

    const transparent = await encode(canvas);

    const preview = new OffscreenCanvas(w + 80, h + 60);
    const pctx = preview.getContext("2d");
    pctx.fillStyle = "#0a050a";
    pctx.fillRect(0, 0, preview.width, preview.height);
    pctx.drawImage(canvas, 40, 30);
    const onInk = await encode(preview);

    return { w, h, kept: bestSize, transparent, onInk };
  },
  { base64: srcBase64, radius }
);

await writeFile(join(previewDir, `${outName}.png`), Buffer.from(result.transparent, "base64"));
await writeFile(join(previewDir, `${outName}-ink.png`), Buffer.from(result.onInk, "base64"));

console.log(
  `${outName}: ${result.w}x${result.h}, core ${result.kept}px (radius ${radius}) -> scripts/_preview/`
);

await browser.close();
