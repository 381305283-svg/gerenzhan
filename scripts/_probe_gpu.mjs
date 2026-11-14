/**
 * Dev probe: report the WebGL renderer Chromium actually uses, plus page metrics.
 *
 *   node scripts/_probe_gpu.mjs [--headed]
 */
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const headed = process.argv.includes("--headed");

const executablePath = [
  process.env.CHROME_PATH,
  "C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe",
].find((p) => p && existsSync(p));

const browser = await chromium.launch({
  executablePath,
  headless: !headed,
  args: ["--use-angle=d3d11", "--enable-gpu-rasterization", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "load" });
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  return {
    webgl2: !!canvas.getContext("webgl2"),
    vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : "n/a",
    renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "n/a",
    dpr: window.devicePixelRatio,
    viewport: [window.innerWidth, window.innerHeight],
    docHeight: document.documentElement.scrollHeight,
    heroHeight: document.querySelector(".hero")?.getBoundingClientRect().height,
  };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
