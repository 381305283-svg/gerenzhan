import { useEffect, useState } from "react";
import { nav, profile } from "../data/site.js";
import "./Nav.css";

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = nav
      .map((item) => document.querySelector(item.href))
      .filter(Boolean);
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.2, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className={`nav ${solid ? "is-solid" : ""}`}>
      <div className="nav__inner shell">
        <a className="nav__brand" href="#top" aria-label={`${profile.name} 首页`}>
          <span className="nav__mark" aria-hidden="true">
            <svg viewBox="0 0 44 28" role="presentation">
              <path d="M13.6 1.6H7.4C2.6 1.6 0 6.1 0 14s2.6 12.4 7.4 12.4h6.2v-6.6H8.4c-1.9 0-2.8-1.7-2.8-5.8s.9-5.8 2.8-5.8h5.2z" />
              <path className="nav__mark-accent" d="M22 1.6h14.5v6.6h-9.4v3.4h8.2v6.4h-8.2v3.6h9.9v6.6H22z" />
            </svg>
          </span>
          <span className="nav__name">
            {profile.name}
            <em>{profile.latin}</em>
          </span>
        </a>

        <nav className="nav__links" aria-label="页面导航">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={active === item.href ? "is-active" : undefined}
            >
              <span>{item.index}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="nav__actions">
          <span className="nav__status">
            <i aria-hidden="true" />
            可接新项目
          </span>
          <a className="btn btn--primary nav__cta" href="#contact">
            联系我
          </a>
        </div>
      </div>
    </header>
  );
}
