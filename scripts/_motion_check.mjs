/**
 * 临时检查脚本：多分辨率截图 + 滚动性能采样。
 *
 *   node scripts/_motion_check.mjs
 */
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "_check");
const url = "http://127.0.0.1:5173/";

const executablePath = [
  process.env.CHROME_PATH,
  "C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe",
].find((p) => p && existsSync(p));

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath });

async function probe({ reduced }) {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  const problems = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(String(e)));
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(reduced ? 600 : 4200);

  const stats = await page.evaluate(async () => {
    const frames = [];
    let last = performance.now();
    let stop = false;
    const tick = () => {
      const now = performance.now();
      frames.push(now - last);
      last = now;
      if (!stop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const total = document.documentElement.scrollHeight - window.innerHeight;
    const duration = 7000;
    const start = performance.now();
    await new Promise((resolve) => {
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / duration);
        window.scrollTo({ top: total * t, behavior: "instant" });
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    stop = true;

    const sorted = [...frames].sort((a, b) => a - b);
    const avg = frames.reduce((sum, f) => sum + f, 0) / frames.length;
    return {
      frames: frames.length,
      fps: +(1000 / avg).toFixed(1),
      p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
      max: +sorted[sorted.length - 1].toFixed(1),
      longFrames: frames.filter((f) => f > 33.3).length,
      docHeight: document.documentElement.scrollHeight,
    };
  });

  // 滚回顶部，检查首屏最终状态
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, `perf-${reduced ? "reduced" : "motion"}-top.png`) });
  await page.close();
  return { stats, problems };
}

const normal = await probe({ reduced: false });
const reduced = await probe({ reduced: true });
console.log("motion   :", JSON.stringify(normal.stats), normal.problems.join(" | ") || "");
console.log("reduced  :", JSON.stringify(reduced.stats), reduced.problems.join(" | ") || "");

const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(4200);
for (const [w, h] of [
  [1920, 1080],
  [1280, 800],
  [834, 1112],
  [390, 844],
]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(outDir, `hero-${w}x${h}.png`) });
  await page.evaluate(() => {
    const node = document.querySelector("#works .works__grid");
    if (node) {
      window.scrollTo({
        top: node.getBoundingClientRect().top + window.scrollY - 40,
        behavior: "instant",
      });
    }
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(outDir, `works-${w}x${h}.png`) });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(300);
}

await browser.close();
console.log("check images written to", outDir);
