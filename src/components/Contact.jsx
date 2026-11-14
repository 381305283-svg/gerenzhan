import { useEffect, useState } from "react";
import SectionHead from "./SectionHead.jsx";
import { profile } from "../data/site.js";
import "./Contact.css";

export default function Contact() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="contact" id="contact">
      <div className="contact__glow" aria-hidden="true" />

      <div className="contact__inner shell">
        <SectionHead
          index="04"
          display="Let's Talk"
          title="联系方式"
          eyebrow="Contact / Get in Touch"
          compact
        />

        <div className="contact__main">
          <div className="contact__claim">
            <h3>
              <span className="ln">
                <span className="ln__i">手里有片子，</span>
              </span>
              <span className="ln">
                <span className="ln__i">或者只是想聊聊创意，</span>
              </span>
              <span className="ln">
                <span className="ln__i">
                  <em>随时找我。</em>
                </span>
              </span>
            </h3>
            <p>
              8 年后期与动效经验，擅长把素材、节奏和表达揉成一支能交付的片子。
              长期接项目合作，也在看合适的机会。
            </p>
          </div>

          <div className="contact__panel">
            <a className="contact__mail" href={`mailto:${profile.email}`}>
              <span className="eyebrow eyebrow--accent">Email</span>
              <strong>{profile.email}</strong>
              <i aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </i>
            </a>

            <div className="contact__rows">
              <a href={`tel:${profile.phone}`}>
                <span className="eyebrow">Phone</span>
                <strong>{profile.phone}</strong>
              </a>
              <div>
                <span className="eyebrow">Location</span>
                <strong>{profile.city}</strong>
              </div>
              <div>
                <span className="eyebrow">Status</span>
                <strong className="contact__status">
                  <i aria-hidden="true" />
                  可接新项目 · 可到岗
                </strong>
              </div>
            </div>

            <div className="contact__actions">
              <button type="button" className="btn btn--primary" onClick={copyEmail}>
                {copied ? "邮箱已复制" : "复制邮箱"}
                <span className="btn__dot" aria-hidden="true" />
              </button>
              <a className="btn btn--ghost" href={`tel:${profile.phone}`}>
                拨打电话
              </a>
            </div>
          </div>
        </div>

        <footer className="contact__footer">
          <div className="contact__footer-brand">
            <span className="contact__mono">CE</span>
            <span>
              {profile.name} · {profile.roleLine}
            </span>
          </div>
          <div className="contact__footer-meta">
            <span>© {new Date().getFullYear()} {profile.name}</span>
            <span>Built with React + Vite</span>
            <a href="#top">回到顶部 ↑</a>
          </div>
        </footer>
      </div>
    </section>
  );
}
