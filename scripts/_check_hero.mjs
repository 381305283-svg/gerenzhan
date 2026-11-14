import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "_check");
await mkdir(outDir, { recursive: true });

const executablePath = [
  process.env.CHROME_PATH,
  "C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe",
  "C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1217/chrome-win64/headless_shell.exe",
].find((p) => p && existsSync(p));

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const problems = [];
page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
page.on("pageerror", (e) => problems.push(String(e)));
page.on("response", (r) => {
  if (r.url().includes("/media/") && r.status() >= 400) problems.push(`${r.status()} ${r.url()}`);
});

await page.goto("http://127.0.0.1:5173/", { waitUntil: "load" });
await page.waitForTimeout(1500);

for (const [w, h] of [
  [2560, 1440],
  [1440, 900],
  [1180, 820],
  [1024, 768],
  [834, 1112],
  [390, 844],
]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, `hero-${w}x${h}.png`) });
}

console.log("problems:", problems.length ? problems : "none");
await browser.close();
