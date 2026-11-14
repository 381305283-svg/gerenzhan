/**
 * 临时检查脚本：按时间点截取首屏开场的中间帧，确认动效序列。
 *
 *   node scripts/_opening_frames.mjs [url]
 */
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "_opening");
const url = process.argv[2] ?? "http://127.0.0.1:5173/";

const candidates = [
  process.env.CHROME_PATH,
  "C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe",
  "C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1217/chrome-win64/headless_shell.exe",
].filter(Boolean);

const executablePath = candidates.find((path) => existsSync(path));
if (!executablePath) {
  console.error("No Chromium found.");
  process.exit(1);
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath, args: ["--force-color-profile=srgb"] });
const page = await browser.newPage({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
});

const problems = [];
page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") {
    problems.push(`${message.type()}: ${message.text()}`);
  }
});
page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
page.on("requestfailed", (request) => problems.push(`404/failed: ${request.url()}`));

const started = Date.now();
await page.goto(url, { waitUntil: "domcontentloaded" });

const stamps = [300, 700, 1100, 1500, 1900, 2400, 3000, 3600];
for (const stamp of stamps) {
  const wait = stamp - (Date.now() - started);
  if (wait > 0) await page.waitForTimeout(wait);
  await page.screenshot({ path: join(outDir, `t${String(stamp).padStart(4, "0")}.png`) });
}

// 稳定后再来两张：首屏 + 滚到精选项目
await page.waitForTimeout(1400);
await page.screenshot({ path: join(outDir, "hero-final.png") });
await page.evaluate(() => {
  const node = document.querySelector("#works .works__grid");
  if (node) window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - 120 });
});
await page.waitForTimeout(700);
await page.screenshot({ path: join(outDir, "works-mid.png") });
await page.waitForTimeout(2600);
await page.screenshot({ path: join(outDir, "works-settled.png") });

await browser.close();
console.log("frames written to", outDir);
console.log(problems.length ? problems.join("\n") : "no console problems");
