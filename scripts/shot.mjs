/**
 * Screenshot helper for visual QA.
 *
 *   node scripts/shot.mjs [url]
 *
 * Uses the Chromium already installed in the Codex runtime, so no browser download
 * is needed. Output lands in scripts/shots/.
 */
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "shots");
const url = process.argv[2] ?? "http://127.0.0.1:5173/";

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

const browser = await chromium.launch({ executablePath, args: ["--force-color-profile=srgb"] });
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});

const problems = [];
page.on("console", (message) => {
  if (message.type() === "error") problems.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));

await page.goto(url, { waitUntil: "load" });

// 开场幕布 + 首屏动效播完再截图，避免拍到中间帧
await page.waitForTimeout(4200);
await page.evaluate(() => {
  document.querySelectorAll("video").forEach((node) => {
    node.pause();
    node.currentTime = 0;
  });
});

const shots = [
  ["01-hero", "#top"],
  ["02-about", "#about"],
  ["03-about-ip", "#about .about__ip"],
  ["04-works", "#works"],
  ["05-strengths", "#strengths"],
  ["06-contact", "#contact"],
];

for (const [name, selector] of shots) {
  await page.evaluate((sel) => {
    const node = document.querySelector(sel);
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "instant" });
  }, selector);
  // 等这一屏的入场动效走完，截到的是最终状态
  await page.waitForTimeout(3200);
  await page.screenshot({ path: join(outDir, `${name}.png`), scale: "css" });
}

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: join(outDir, "00-full.png"), fullPage: true, scale: "css" });

await browser.close();
console.log("shots written to", outDir);
if (problems.length) {
  console.log("page problems:");
  problems.forEach((item) => console.log(" -", item));
} else {
  console.log("no console errors");
}
