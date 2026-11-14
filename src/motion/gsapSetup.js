import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// 全站统一的动效语言：慢节奏、长缓动、不用回弹（back/elastic）。
gsap.defaults({ ease: "power3.out", duration: 1.1 });

// 移动端地址栏收起会触发 resize，忽略它可以避免 ScrollTrigger 抖动。
ScrollTrigger.config({ ignoreMobileResize: true });

export const EASE = {
  /** 大标题：前端发力、尾巴很长，收得干净 */
  title: "power4.out",
  /** 卡片、正文：柔和匀速收尾 */
  soft: "power2.out",
  /** 幕布、遮罩 */
  curtain: "power3.inOut",
  inOut: "power3.inOut",
};

export const DUR = {
  title: 1.4,
  card: 1.15,
  media: 1.5,
};

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** 图片、字体加载完成后重新测量滚动位置，避免触发器落点偏移。 */
export function scheduleRefresh() {
  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts?.ready) {
    document.fonts.ready.then(refresh).catch(() => {});
  }
  if (document.readyState === "complete") {
    window.setTimeout(refresh, 120);
  } else {
    window.addEventListener("load", refresh, { once: true });
  }
  refreshOnImages(refresh, ".plate__media img");
}

function refreshOnImages(refresh, selector) {
  document.querySelectorAll(selector).forEach((img) => {
    if (img.complete) return;
    img.addEventListener("load", refresh, { once: true });
    img.addEventListener("error", refresh, { once: true });
  });
}

/** 读元素当前的 CSS 数值，避免 GSAP 内联样式覆盖响应式取值。 */
export function cssNumber(el, prop, fallback) {
  if (!el) return fallback;
  const value = Number.parseFloat(window.getComputedStyle(el)[prop]);
  return Number.isFinite(value) ? value : fallback;
}

export { gsap, ScrollTrigger };
