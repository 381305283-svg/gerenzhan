/**
 * Rebuild the hero mascot matte.
 *
 * The first pass of the source cutout kept flat patches of the turnaround-sheet
 * paper around the character (they are fused to the fur silhouette, so eroding
 * cannot separate them). Paper and fur differ in texture though: the paper is
 * flat, the fur is filamented. This script classifies flat light pixels inside
 * the existing alpha as paper, drops them, keeps the largest remaining blob,
 * fills interior holes and feathers the edge.
 *
 *   node scripts/matte_hero.mjs [--lum=205] [--std=6] [--open=2] [--trim=2] [--out=hero-figure]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const previewDir = join(here, "_preview");
const srcFile = join(here, "..", "public", "media", "hero-character.png");

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    return [key, value];
  })
);

const params = {
  lum: Number(args.lum ?? 205),
  std: Number(args.std ?? 6),
  open: Number(args.open ?? 2),
  trim: Number(args.trim ?? 2),
  feather: Number(args.feather ?? 3),
  out: args.out ?? "hero-figure",
};

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
  async ({ base64, params }) => {
    const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const { width: w, height: h } = bitmap;

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const img = ctx.getImageData(0, 0, w, h);
    const px = img.data;
    const n = w * h;

    // ---- luma + local texture ----
    const luma = new Float32Array(n);
    const alpha = new Uint8Array(n);
    for (let i = 0; i < n; i += 1) {
      const r = px[i * 4];
      const g = px[i * 4 + 1];
      const b = px[i * 4 + 2];
      luma[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      alpha[i] = px[i * 4 + 3];
    }

    // box average of luma and of luma^2 -> local std (5x5)
    const avg = new Float32Array(n);
    const avg2 = new Float32Array(n);
    const boxPass = (src) => {
      const tmp = new Float32Array(n);
      const out = new Float32Array(n);
      const r = 2;
      const win = 2 * r + 1;
      for (let y = 0; y < h; y += 1) {
        const row = y * w;
        let sum = 0;
        for (let k = -r; k <= r; k += 1) sum += src[row + Math.min(w - 1, Math.max(0, k))];
        for (let x = 0; x < w; x += 1) {
          tmp[row + x] = sum / win;
          sum += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
        }
      }
      for (let x = 0; x < w; x += 1) {
        let sum = 0;
        for (let k = -r; k <= r; k += 1) sum += tmp[Math.min(h - 1, Math.max(0, k)) * w + x];
        for (let y = 0; y < h; y += 1) {
          out[y * w + x] = sum / win;
          sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
        }
      }
      return out;
    };
    const lumAvg = boxPass(luma);
    const lumaSq = new Float32Array(n);
    for (let i = 0; i < n; i += 1) lumaSq[i] = luma[i] * luma[i];
    const sqAvg = boxPass(lumaSq);
    const tex = new Float32Array(n);
    for (let i = 0; i < n; i += 1) tex[i] = Math.sqrt(Math.max(0, sqAvg[i] - lumAvg[i] * lumAvg[i]));

    // ---- classify ----
    const keep = new Uint8Array(n);
    for (let i = 0; i < n; i += 1) {
      if (alpha[i] <= 32) continue;
      const paper = lumAvg[i] >= params.lum && tex[i] <= params.std;
      keep[i] = paper ? 0 : 1;
    }

    const morph = (src, r, want) => {
      if (r <= 0) return src.slice();
      const tmp = new Uint8Array(n);
      const out = new Uint8Array(n);
      for (let y = 0; y < h; y += 1) {
        const row = y * w;
        for (let x = 0; x < w; x += 1) {
          let acc = src[row + x];
          for (let k = 1; k <= r; k += 1) {
            if (x - k >= 0) acc = want ? Math.max(acc, src[row + x - k]) : Math.min(acc, src[row + x - k]);
            if (x + k < w) acc = want ? Math.max(acc, src[row + x + k]) : Math.min(acc, src[row + x + k]);
          }
          tmp[row + x] = acc;
        }
      }
      for (let x = 0; x < w; x += 1) {
        for (let y = 0; y < h; y += 1) {
          const idx = y * w + x;
          let acc = tmp[idx];
          for (let k = 1; k <= r; k += 1) {
            if (y - k >= 0) acc = want ? Math.max(acc, tmp[idx - k * w]) : Math.min(acc, tmp[idx - k * w]);
            if (y + k < h) acc = want ? Math.max(acc, tmp[idx + k * w]) : Math.min(acc, tmp[idx + k * w]);
          }
          out[idx] = acc;
        }
      }
      return out;
    };

    const opened = morph(morph(keep, params.open, 0), params.open, 1);

    // ---- largest blob ----
    const label = new Int32Array(n).fill(-1);
    const stack = new Int32Array(n);
    let best = -1;
    let bestSize = 0;
    let current = 0;
    for (let start = 0; start < n; start += 1) {
      if (!opened[start] || label[start] !== -1) continue;
      let sp = 0;
      stack[sp++] = start;
      label[start] = current;
      let size = 0;
      while (sp > 0) {
        const idx = stack[--sp];
        size += 1;
        const x = idx % w;
        const y = (idx - x) / w;
        if (x > 0 && opened[idx - 1] && label[idx - 1] === -1) {
          label[idx - 1] = current;
          stack[sp++] = idx - 1;
        }
        if (x < w - 1 && opened[idx + 1] && label[idx + 1] === -1) {
          label[idx + 1] = current;
          stack[sp++] = idx + 1;
        }
        if (y > 0 && opened[idx - w] && label[idx - w] === -1) {
          label[idx - w] = current;
          stack[sp++] = idx - w;
        }
        if (y < h - 1 && opened[idx + w] && label[idx + w] === -1) {
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

    let solid = new Uint8Array(n);
    for (let i = 0; i < n; i += 1) solid[i] = label[i] === best ? 1 : 0;

    // ---- fill interior holes (anything not reachable from the border) ----
    const outside = new Uint8Array(n);
    let sp = 0;
    const push = (idx) => {
      if (!solid[idx] && !outside[idx]) {
        outside[idx] = 1;
        stack[sp++] = idx;
      }
    };
    for (let x = 0; x < w; x += 1) {
      push(x);
      push((h - 1) * w + x);
    }
    for (let y = 0; y < h; y += 1) {
      push(y * w);
      push(y * w + w - 1);
    }
    while (sp > 0) {
      const idx = stack[--sp];
      const x = idx % w;
      const y = (idx - x) / w;
      if (x > 0) push(idx - 1);
      if (x < w - 1) push(idx + 1);
      if (y > 0) push(idx - w);
      if (y < h - 1) push(idx + w);
    }
    for (let i = 0; i < n; i += 1) if (!solid[i] && !outside[i]) solid[i] = 1;

    // ---- trim the paper fringe, then feather ----
    const trimmed = params.trim > 0 ? morph(solid, params.trim, 0) : solid;

    const blur = (src, r) => {
      if (r <= 0) return Float32Array.from(src);
      const tmp = new Float32Array(n);
      const out = new Float32Array(n);
      const win = 2 * r + 1;
      for (let y = 0; y < h; y += 1) {
        const row = y * w;
        let sum = 0;
        for (let k = -r; k <= r; k += 1) sum += src[row + Math.min(w - 1, Math.max(0, k))];
        for (let x = 0; x < w; x += 1) {
          tmp[row + x] = sum / win;
          sum += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
        }
      }
      for (let x = 0; x < w; x += 1) {
        let sum = 0;
        for (let k = -r; k <= r; k += 1) sum += tmp[Math.min(h - 1, Math.max(0, k)) * w + x];
        for (let y = 0; y < h; y += 1) {
          out[y * w + x] = sum / win;
          sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
        }
      }
      return out;
    };

    const soft = blur(trimmed, params.feather);
    for (let i = 0; i < n; i += 1) {
      const m = Math.min(1, soft[i] * 1.4);
      px[i * 4 + 3] = Math.round(Math.max(0, Math.min(1, (alpha[i] / 255) * m)) * 255);
    }
    ctx.putImageData(img, 0, 0);

    const encode = async (target) => {
      const out = await target.convertToBlob({ type: "image/png" });
      const buf = new Uint8Array(await out.arrayBuffer());
      let binary = "";
      for (let i = 0; i < buf.length; i += 0x8000) {
        binary += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      }
      return btoa(binary);
    };

    const transparent = await encode(canvas);

    const preview = new OffscreenCanvas(w + 80, h + 60);
    const pctx = preview.getContext("2d");
    pctx.fillStyle = "#0a050a";
    pctx.fillRect(0, 0, preview.width, preview.height);
    // faint reference grid so leftover paper is easy to spot
    pctx.strokeStyle = "rgba(255,61,166,0.16)";
    for (let x = 0; x <= preview.width; x += 40) {
      pctx.beginPath();
      pctx.moveTo(x, 0);
      pctx.lineTo(x, preview.height);
      pctx.stroke();
    }
    pctx.drawImage(canvas, 40, 30);
    const onInk = await encode(preview);

    return { w, h, kept: bestSize, transparent, onInk };
  },
  { base64: srcBase64, params }
);

await writeFile(join(previewDir, `${params.out}.png`), Buffer.from(result.transparent, "base64"));
await writeFile(join(previewDir, `${params.out}-ink.png`), Buffer.from(result.onInk, "base64"));

console.log(
  `${params.out}: ${result.w}x${result.h}, core ${result.kept}px, lum>=${params.lum}, std<=${params.std}`
);

await browser.close();
