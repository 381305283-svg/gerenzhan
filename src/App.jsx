import { useRef } from "react";
import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import PageWaves from "./components/PageWaves.jsx";
import About from "./components/About.jsx";
import Works from "./components/Works.jsx";
import Strengths from "./components/Strengths.jsx";
import Contact from "./components/Contact.jsx";
import Intro from "./components/Intro.jsx";
import { useOpening } from "./hooks/useOpening.js";
import { useSiteMotion } from "./hooks/useSiteMotion.js";

export default function App() {
  const siteRef = useRef(null);
  const introRef = useRef(null);

  // 两个 hook 都走 useLayoutEffect，首次绘制前就把动效起点铺好
  useOpening(siteRef, introRef);
  useSiteMotion(siteRef);

  return (
    <div className="site" ref={siteRef}>
      <Intro hostRef={introRef} />
      <Nav />
      <PageWaves />
      <main>
        <Hero />
        <About />
        <Works />
        <Strengths />
        <Contact />
      </main>
      <div className="grain" aria-hidden="true" />
    </div>
  );
}
