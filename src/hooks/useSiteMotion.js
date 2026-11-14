import { useLayoutEffect } from "react";
import { DUR, EASE, gsap, prefersReducedMotion, scheduleRefresh } from "../motion/gsapSetup.js";
import { splitChars, splitWords } from "../motion/split.js";

/**
 * 滚动动效总控。
 *
 * 统一在这里建 ScrollTrigger，而不是散在每个组件里：
 * 缓动、节奏、触发点集中一处，改起来不会互相打架。
 * 所有入场都在 useLayoutEffect 里落位，第一次绘制前元素已经在起点上。
 */
export function useSiteMotion(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (prefersReducedMotion()) return undefined;

    const ctx = gsap.context(() => {
      animateHeads(root);
      animateAbout(root);
      animateWorks(root);
      animateStrengths(root);
      animateContact(root);
      animateAmbient(root);
    }, root);

    scheduleRefresh();
    return () => ctx.revert();
  }, [rootRef]);
}

/* ---------------------------------------------------------------- 工具 */

const once = (trigger, start = "top 84%") => ({ trigger, start, once: true });

function ok(target) {
  if (!target) return false;
  if (target instanceof Element) return true;
  return typeof target.length === "number" ? target.length > 0 : true;
}

/** 只在目标存在时挂 tween，避免空选择器在控制台刷警告。 */
function add(timeline, target, fromVars, toVars, position = 0) {
  if (!ok(target)) return timeline;
  return timeline.fromTo(target, fromVars, toVars, position);
}

/** 图片 reveal：遮罩从下往上揭开，同时轻微回落到原尺寸。 */
function mediaReveal(inner, { timeline, position = 0, start = "top 88%", delay = 0 } = {}) {
  if (!inner) return;
  const from = { clipPath: "inset(0% 0% 100% 0%)", scale: 1.08 };
  const to = {
    clipPath: "inset(0% 0% 0% 0%)",
    scale: 1,
    duration: DUR.media,
    ease: EASE.inOut,
    clearProps: "clipPath,transform",
  };
  if (timeline) {
    timeline.fromTo(inner, from, to, position);
    return;
  }
  gsap.fromTo(inner, from, {
    ...to,
    delay,
    scrollTrigger: once(inner, start),
  });
}

/* ------------------------------------------------------- 每个模块的标题 */

function animateHeads(root) {
  root.querySelectorAll(".section-head").forEach((head) => {
    const index = head.querySelector(".section-head__index");
    const rule = head.querySelector(".section-head__rule");
    const words = splitWords(head.querySelector(".section-head__display"));
    const titleChars = splitChars(head.querySelector(".section-head__title"));
    const eyebrow = head.querySelector(".eyebrow");
    const meta = head.querySelector(".section-head__meta");

    const tl = gsap.timeline({ scrollTrigger: once(head, "top 86%") });

    // 底部的分隔线先拉出来，像把一个版面铺开
    add(
      tl,
      rule,
      { scaleX: 0 },
      { scaleX: 1, duration: 1.5, ease: EASE.inOut, transformOrigin: "left center" },
      0
    );
    add(
      tl,
      index,
      { autoAlpha: 0, yPercent: 70 },
      { autoAlpha: 1, yPercent: 0, duration: 0.95, ease: EASE.title },
      0.08
    );
    // 英文大标题：从遮罩里大幅推上来
    add(
      tl,
      words,
      { yPercent: 150, autoAlpha: 0, skewY: 4, scaleY: 1.12 },
      {
        yPercent: 0,
        autoAlpha: 1,
        skewY: 0,
        scaleY: 1,
        duration: DUR.title,
        ease: EASE.title,
        stagger: 0.09,
        clearProps: "transform",
      },
      0.12
    );
    // 中文小标题逐字跟进
    add(
      tl,
      titleChars,
      { yPercent: 140, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 1, ease: EASE.title, stagger: 0.05 },
      0.52
    );
    add(tl, eyebrow, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.68);
    add(tl, meta, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0.3);
    add(
      tl,
      meta?.children,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 },
      0.34
    );
  });
}

/* ------------------------------------------------------------ 01 个人经历 */

function animateAbout(root) {
  const section = root.querySelector("#about");
  if (!section) return;

  const left = section.querySelector(".about__left");
  const portrait = left?.querySelector(".about__portrait");
  if (left) {
    const tl = gsap.timeline({ scrollTrigger: once(left, "top 82%") });
    add(
      tl,
      portrait,
      { autoAlpha: 0, y: 72 },
      { autoAlpha: 1, y: 0, duration: 1.25, ease: EASE.soft },
      0
    );
    mediaReveal(portrait?.querySelector(".media__inner"), { timeline: tl, position: 0.08 });
    add(
      tl,
      left.querySelectorAll(".about__facts > div"),
      { autoAlpha: 0, x: -26 },
      { autoAlpha: 1, x: 0, duration: 0.9, stagger: 0.07 },
      0.24
    );
    add(
      tl,
      left.querySelector(".about__contact"),
      { autoAlpha: 0, y: 34 },
      { autoAlpha: 1, y: 0, duration: 1.05 },
      0.42
    );
  }

  const intro = section.querySelector(".about__intro");
  if (intro) {
    const tl = gsap.timeline({ scrollTrigger: once(intro, "top 84%") });
    add(
      tl,
      intro.children,
      { autoAlpha: 0, y: 34 },
      { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12 },
      0
    );
  }

  const stats = section.querySelector(".about__stats");
  if (stats) {
    const tl = gsap.timeline({ scrollTrigger: once(stats, "top 86%") });
    add(
      tl,
      stats.querySelectorAll(".stat"),
      { autoAlpha: 0, y: 44 },
      { autoAlpha: 1, y: 0, duration: 1.05, stagger: 0.09 },
      0
    );
  }

  const timeline = section.querySelector(".about__timeline");
  if (timeline) {
    const tl = gsap.timeline({ scrollTrigger: once(timeline, "top 86%") });
    add(
      tl,
      timeline.querySelector(".about__timeline-head"),
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.9 },
      0
    );
    add(
      tl,
      timeline.querySelectorAll(".xp"),
      { autoAlpha: 0, y: 30 },
      { autoAlpha: 1, y: 0, duration: 0.95, stagger: 0.08 },
      0.12
    );
  }

  const ip = section.querySelector(".about__ip");
  if (ip) {
    const copy = ip.querySelector(".about__ip-copy");
    const plate = ip.querySelector(".about__ip-plate");
    const tl = gsap.timeline({ scrollTrigger: once(ip, "top 84%") });
    add(
      tl,
      ip.querySelectorAll(".eyebrow, h3, p, .about__ip-meta li"),
      { autoAlpha: 0, y: 26 },
      { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 },
      0
    );
    add(tl, copy, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0);
    add(tl, plate, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 0.1);
    mediaReveal(plate?.querySelector(".media__inner"), { timeline: tl, position: 0.16 });
  }
}

/* ------------------------------------------------------------ 02 精选项目 */

function animateWorks(root) {
  const section = root.querySelector("#works");
  if (!section) return;

  section.querySelectorAll(".work").forEach((card, index) => {
    const tl = gsap.timeline({
      scrollTrigger: once(card, "top 88%"),
      // 同一行的两张卡片错开半拍，读起来是「依次」而不是「一起」
      delay: (index % 2) * 0.14,
    });
    add(
      tl,
      card,
      { autoAlpha: 0, y: 86 },
      { autoAlpha: 1, y: 0, duration: 1.2, ease: EASE.soft },
      0
    );
    mediaReveal(card.querySelector(".work__media .media__inner"), { timeline: tl, position: 0.06 });
    add(
      tl,
      card.querySelectorAll(".work__head, .work__latin, .work__tags"),
      { autoAlpha: 0, y: 26 },
      { autoAlpha: 1, y: 0, duration: 0.95, stagger: 0.08 },
      0.32
    );
  });

  const note = section.querySelector(".works__note");
  if (note) {
    gsap.fromTo(
      note,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 1, ease: EASE.soft, scrollTrigger: once(note, "top 94%") }
    );
  }
}

/* ------------------------------------------------------------ 03 个人优势 */

function animateStrengths(root) {
  const section = root.querySelector("#strengths");
  if (!section) return;

  const columns = 3;
  section.querySelectorAll(".strength").forEach((card, index) => {
    const tl = gsap.timeline({
      scrollTrigger: once(card, "top 90%"),
      delay: (index % columns) * 0.12,
    });
    add(
      tl,
      card,
      { autoAlpha: 0, y: 60 },
      { autoAlpha: 1, y: 0, duration: 1.15, ease: EASE.soft },
      0
    );
    add(
      tl,
      card.querySelectorAll(".strength__latin, .strength__desc, .strength__points"),
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.07 },
      0.2
    );
  });

  const tools = section.querySelector(".strengths__tools");
  if (tools) {
    const tl = gsap.timeline({ scrollTrigger: once(tools, "top 90%") });
    add(tl, tools, { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, duration: 1.15 }, 0);
    add(
      tl,
      tools.querySelectorAll(".strengths__tools-list li"),
      { autoAlpha: 0, y: 18, scale: 0.96 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.045 },
      0.18
    );
  }
}

/* ------------------------------------------------------------ 04 联系方式 */

function animateContact(root) {
  const section = root.querySelector("#contact");
  if (!section) return;

  const claim = section.querySelector(".contact__claim");
  if (claim) {
    const tl = gsap.timeline({ scrollTrigger: once(claim, "top 84%") });
    add(
      tl,
      claim.querySelectorAll(".ln__i"),
      { yPercent: 150, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 1.35, ease: EASE.title, stagger: 0.11 },
      0
    );
    add(
      tl,
      claim.querySelector("p"),
      { autoAlpha: 0, y: 28 },
      { autoAlpha: 1, y: 0, duration: 1.1 },
      0.4
    );
  }

  const panel = section.querySelector(".contact__panel");
  if (panel) {
    const tl = gsap.timeline({ scrollTrigger: once(panel, "top 86%") });
    add(
      tl,
      panel,
      { autoAlpha: 0, y: 64 },
      { autoAlpha: 1, y: 0, duration: 1.2, ease: EASE.soft },
      0
    );
    add(
      tl,
      panel.querySelectorAll(".contact__mail, .contact__rows, .contact__actions"),
      { autoAlpha: 0, y: 26 },
      { autoAlpha: 1, y: 0, duration: 0.95, stagger: 0.1 },
      0.26
    );
  }

  const footer = section.querySelector(".contact__footer");
  if (footer) {
    gsap.fromTo(
      footer,
      { autoAlpha: 0, y: 22 },
      { autoAlpha: 1, y: 0, duration: 1, scrollTrigger: once(footer, "top 96%") }
    );
  }
}

/* ------------------------------------------------------- 轻微的视差纵深 */

function animateAmbient(root) {
  const hero = root.querySelector(".hero");
  const video = hero?.querySelector(".hero__video");
  const inner = hero?.querySelector(".hero__inner");
  const footer = hero?.querySelector(".hero__footer");

  // 首屏滚出：背景缓慢放大，文案被留在后面。
  // immediateRender: false —— 别抢开场时间线对视频 scale 的控制。
  if (hero && video) {
    gsap.fromTo(
      video,
      { scale: 1 },
      {
        scale: 1.12,
        ease: "none",
        immediateRender: false,
        scrollTrigger: {
          trigger: hero,
          start: "top top-=160",
          end: "bottom top",
          scrub: 0.8,
        },
      }
    );
  }
  [
    [inner, -80, 0.12],
    [footer, -30, 0],
  ].forEach(([target, y, alpha]) => {
    if (!target) return;
    gsap.fromTo(
      target,
      { y: 0, autoAlpha: 1 },
      {
        y,
        autoAlpha: alpha,
        ease: "none",
        immediateRender: false,
        scrollTrigger: {
          trigger: hero,
          start: "top top-=160",
          end: "bottom top",
          scrub: 0.8,
        },
      }
    );
  });

  // 角色 IP 图与联系区光晕走一点反向位移，制造纵深。
  const ipPlate = root.querySelector(".about__ip-plate");
  if (ipPlate) {
    gsap.fromTo(
      ipPlate,
      { y: 26 },
      {
        y: -26,
        ease: "none",
        immediateRender: false,
        scrollTrigger: { trigger: ipPlate, start: "top bottom", end: "bottom top", scrub: 0.9 },
      }
    );
  }

  const glow = root.querySelector(".contact__glow");
  if (glow) {
    gsap.fromTo(
      glow,
      { y: 40 },
      {
        y: -40,
        ease: "none",
        immediateRender: false,
        scrollTrigger: {
          trigger: root.querySelector("#contact"),
          start: "top bottom",
          end: "bottom bottom",
          scrub: 0.9,
        },
      }
    );
  }
}
