import { useEffect, useRef } from "react";
import GradientWaves from "./GradientWaves.jsx";
import "./PageWaves.css";

/**
 * 头图下方的动效背景。
 *
 * - 用 fixed 视口尺寸渲染：波纹效果按横向视口比例构图，整页高度画布会被拉长且开销过大。
 * - 头图滚过视口后再淡入，避免在头图半透明的遮罩下透出。
 */
export default function PageWaves() {
  const hostRef = useRef(null);

  // 这一层在内容之下、且 pointer-events: none，canvas 收不到指针事件；
  // 把窗口级的指针移动转发给它，保留组件自带的视差漂移。
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const forward = (event) => {
      const canvas = host.querySelector("canvas");
      if (!canvas) return;
      canvas.dispatchEvent(
        new PointerEvent("pointermove", { clientX: event.clientX, clientY: event.clientY })
      );
    };
    const reset = () => {
      const canvas = host.querySelector("canvas");
      canvas?.dispatchEvent(new PointerEvent("pointerleave"));
    };
    window.addEventListener("pointermove", forward, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", forward);
      document.documentElement.removeEventListener("pointerleave", reset);
    };
  }, []);

  // 头图淡出到一定程度后，波纹背景再淡入
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const hero = document.querySelector(".hero");
      const vh = window.innerHeight;
      const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : vh;
      const start = heroBottom - vh * 0.62;
      const span = Math.max(vh * 0.5, 1);
      const progress = Math.min(1, Math.max(0, (window.scrollY - start) / span));
      host.style.setProperty("--waves-reveal", progress.toFixed(3));
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="page-waves" ref={hostRef} aria-hidden="true">
      <GradientWaves
        horizonColor="#2a0b24"
        waveColor="#ff3da6"
        crestColor="#ff8ac7"
        speed={0.3}
        amplitude={3.0}
        waveScale={1.15}
        waveRatio={0.9}
        swell={42}
        turbulence={26}
        tilt={1.11}
        zoom={1.0}
        height={5.5}
        fogDepth={15}
        detail="medium"
        brightness={1.0}
        opacity={1.0}
        mouseInteraction
        parallaxStrength={0.35}
        grain
        grainIntensity={0.05}
      />
      <div className="page-waves__veil" />
    </div>
  );
}
