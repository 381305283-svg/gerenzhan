/**
 * Dev probe for the GradientWaves background: screenshots the raw effect,
 * the composed page, and measures frame time while the waves are on screen.
 *
 *   node scripts/_check_waves.mjs [--raw]
 */
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "_waves");
await mkdir(outDir, { recursive: true });

const executablePath = [
  process.env.CHROME_PATH,
  "C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe",
].find((p) => p && existsSync(p));

const browser = await chromium.launch({
  executablePath,
  args: ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--force-color-profile=srgb"],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const problems = [];
page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
page.on("pageerror", (e) => problems.push(String(e)));

await page.goto("http://127.0.0.1:5173/", { waitUntil: "load" });
await page.waitForTimeout(1500);

// freeze the hero video so stills are stable
await page.evaluate(() => document.querySelectorAll("video").forEach((v) => v.pause()));

const stops = [
  ["a-hero-fade", 400],
  ["b-about", 1080],
  ["c-works", 3000],
  ["d-contact", 8300],
];

for (const [name, y] of stops) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(outDir, `${name}.png`) });

  const state = await page.evaluate(() => {
    const host = document.querySelector(".page-waves");
    const canvas = host?.querySelector("canvas");
    return {
      reveal: host?.style.getPropertyValue("--waves-reveal"),
      opacity: host ? getComputedStyle(host).opacity : null,
      canvas: canvas ? [canvas.width, canvas.height] : null,
    };
  });
  console.log(name, JSON.stringify(state));
}

// raw effect: full opacity, no veil, no page content on top
await page.evaluate(() => window.scrollTo({ top: 1080, behavior: "instant" }));
await page.evaluate(() => {
  document.querySelector(".page-waves__veil").style.display = "none";
});
await page.waitForTimeout(500);
await page.screenshot({ path: join(outDir, "f-about-noveil.png") });

await page.evaluate(() => {
  const host = document.querySelector(".page-waves");
  host.style.setProperty("--waves-reveal", "1");
  const site = document.querySelector(".site");
  document.querySelector("main").style.display = "none";
  site.style.zIndex = "5";
  host.style.zIndex = "6";
});
await page.waitForTimeout(600);
await page.screenshot({ path: join(outDir, "e-raw.png") });

// frame timing while the waves are animating on screen
await page.reload({ waitUntil: "load" });
await page.waitForTimeout(1200);
await page.evaluate(() => window.scrollTo({ top: 3000, behavior: "instant" }));
await page.waitForTimeout(1000);
const timing = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const frames = [];
      let last = performance.now();
      const tick = (now) => {
        frames.push(now - last);
        last = now;
        if (frames.length < 121) requestAnimationFrame(tick);
        else {
          const sorted = frames.slice(1).sort((a, b) => a - b);
          resolve({
            median: sorted[Math.floor(sorted.length / 2)],
            p90: sorted[Math.floor(sorted.length * 0.9)],
            max: sorted[sorted.length - 1],
          });
        }
      };
      requestAnimationFrame(tick);
    })
);
console.log("frame times (ms):", JSON.stringify(timing));
console.log("problems:", problems.length ? problems : "none");

await browser.close();
