/**
 * Capture the hero at several viewports for visual QA.
 *
 *   node scripts/hero_shot.mjs [url] [tag]
 *
 * Writes scripts/shots/hero-<tag>-<width>.png
 */
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "shots");
const url = process.argv[2] ?? "http://127.0.0.1:5173/";
const tag = process.argv[3] ?? "hero";

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

await mkdir(outDir, { recursive: true });

const viewports = [
  [1920, 1080],
  [1512, 945],
  [1280, 800],
  [834, 1112],
  [390, 844],
];

const browser = await chromium.launch({ executablePath, args: ["--force-color-profile=srgb"] });

for (const [width, height] of viewports) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    document.querySelectorAll("video").forEach((node) => {
      node.pause();
      node.currentTime = 0;
    });
    document.querySelectorAll(".hero__ring-arc").forEach((node) => {
      node.style.animation = "none";
    });
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(outDir, `${tag}-${width}.png`), scale: "css" });
  await page.close();
}

console.log(`hero shots written to ${outDir}`);
await browser.close();
