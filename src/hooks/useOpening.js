import { useLayoutEffect } from "react";
import { cssNumber, EASE, gsap, prefersReducedMotion } from "../motion/gsapSetup.js";
import { restoreSplit, splitChars } from "../motion/split.js";

const INTRO_KEY = "ce-intro-seen";

/**
 * 同一 session 内只播一次完整开场，之后的刷新直接进页面。
 * 在模块作用域读一次，这样 StrictMode 的两次 effect 拿到的是同一个值。
 */
const INTRO_SEEN = (() => {
  try {
    return window.sessionStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
})();

/**
 * 首屏开场：遮罩幕布 + 标题遮罩揭开 / 位移 / 压缩归位。
 *
 * 全部用 useLayoutEffect 在首次绘制前落位，所以元素不会先闪一下再动。
 */
export function useOpening(rootRef, introRef) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    const intro = introRef.current;
    if (!root) return undefined;

    // 尊重系统「减少动态效果」：直接给出最终状态。
    if (prefersReducedMotion()) {
      if (intro) gsap.set(intro, { display: "none" });
      return undefined;
    }

    // 本 session 已经看过开场，直接进页面，滚动动效照常。
    if (INTRO_SEEN) {
      if (intro) gsap.set(intro, { display: "none" });
      return undefined;
    }

    const html = document.documentElement;
    const lockScroll = () => html.classList.add("is-intro");
    const unlockScroll = () => html.classList.remove("is-intro");

    lockScroll();
    try {
      window.sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* 隐私模式下拿不到 sessionStorage，忽略即可 */
    }
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      const hero = root.querySelector(".hero");
      const video = hero?.querySelector(".hero__video");
      const scrim = hero?.querySelector(".hero__scrim");
      const grid = hero?.querySelector(".hero__grid");
      const eyebrow = hero?.querySelector(".hero__lead .eyebrow");
      const nameLine = hero?.querySelector(".hero__title-cn");
      const latinLine = hero?.querySelector(".hero__title-en");
      const nameChars = splitChars(nameLine);
      const latinChars = splitChars(latinLine);
      const lede = hero?.querySelector(".hero__lede");
      const actions = hero?.querySelector(".hero__actions");
      const metaBlocks = hero ? hero.querySelectorAll(".hero__meta-block") : [];
      const footer = hero?.querySelector(".hero__footer-inner");
      const navInner = root.querySelector(".nav__inner");

      const master = gsap.timeline({ defaults: { ease: EASE.title } });

      /* ---------- 幕布 ---------- */
      const mark = intro?.querySelector(".intro__mark");
      const bar = intro?.querySelector(".intro__bar-fill");
      const count = intro?.querySelector(".intro__count");
      const meta = intro ? intro.querySelectorAll(".intro__meta span") : [];
      const inner = intro?.querySelector(".intro__inner");
      const counter = { value: 0 };

      master
        .fromTo(
          mark,
          { autoAlpha: 0, yPercent: 46, scale: 0.94 },
          { autoAlpha: 1, yPercent: 0, scale: 1, duration: 1, ease: EASE.title },
          0
        )
        .fromTo(count, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.08)
        .to(
          counter,
          {
            value: 100,
            duration: 0.92,
            ease: "power2.inOut",
            onUpdate() {
              if (count) count.textContent = String(Math.round(counter.value)).padStart(2, "0");
            },
          },
          0.08
        )
        .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.92, ease: "power2.inOut" }, 0.08)
        .fromTo(
          meta,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1 },
          0.3
        )
        .to(inner, { autoAlpha: 0, yPercent: -16, duration: 0.45, ease: "power2.in" }, 0.98)
        .to(
          intro,
          {
            yPercent: -100,
            duration: 0.92,
            ease: EASE.curtain,
            onComplete: unlockScroll,
          },
          1.14
        )
        .set(intro, { display: "none" }, 2.1);

      /* ---------- 首屏 ----------
       * 幕布自下而上揭开：底部先露出来，所以节奏也从底部往标题推。
       */
      master
        .fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2 }, 1.1)
        .fromTo(
          video,
          { autoAlpha: 0, scale: 1.16 },
          {
            autoAlpha: cssNumber(video, "opacity", 0.66),
            scale: 1,
            duration: 2.1,
            ease: "power2.out",
          },
          1.1
        )
        .fromTo(
          grid,
          { autoAlpha: 0 },
          {
            autoAlpha: cssNumber(grid, "opacity", 0.4),
            duration: 1.3,
            ease: "power2.out",
          },
          1.18
        )
        .fromTo(footer, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 1.05 }, 1.3)
        .fromTo(
          metaBlocks,
          { autoAlpha: 0, y: 32 },
          { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.09 },
          1.38
        )
        .fromTo(actions, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1.05 }, 1.5)
        .fromTo(lede, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.15 }, 1.56)
        // 名字：从遮罩下方推上来，同时把被压扁的字形放回原比例
        .fromTo(
          nameChars,
          { yPercent: 150, autoAlpha: 0, scaleY: 1.42, scaleX: 0.86, skewY: 3 },
          {
            yPercent: 0,
            autoAlpha: 1,
            scaleY: 1,
            scaleX: 1,
            skewY: 0,
            duration: 1.55,
            ease: EASE.title,
            stagger: 0.085,
          },
          1.68
        )
        // 英文名：整行从横向压扁的状态展开归位，逐字跟上
        .fromTo(
          latinLine,
          { scaleX: 1.2 },
          { scaleX: 1, duration: 1.5, ease: "expo.out", transformOrigin: "left center" },
          1.98
        )
        .fromTo(
          latinChars,
          { yPercent: 150, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 1.25,
            ease: EASE.title,
            stagger: 0.05,
          },
          1.98
        )
        .fromTo(
          eyebrow,
          { autoAlpha: 0, y: 16, letterSpacing: "0.62em" },
          { autoAlpha: 1, y: 0, letterSpacing: "0.32em", duration: 1.1 },
          2.04
        )
        .fromTo(navInner, { autoAlpha: 0, y: -22 }, { autoAlpha: 1, y: 0, duration: 1.1 }, 2.02);
    }, root);

    return () => {
      unlockScroll();
      ctx.revert();
      [".hero__title-cn", ".hero__title-en"].forEach((selector) =>
        restoreSplit(root.querySelector(selector))
      );
    };
  }, [rootRef, introRef]);
}
