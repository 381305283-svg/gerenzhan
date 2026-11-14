import { profile, ticker } from "../data/site.js";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero" id="top">
      <video
        className="hero__video"
        src="/media/hero-loop.mp4"
        poster="/media/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="hero__scrim" aria-hidden="true" />
      <div className="hero__grid" aria-hidden="true" />

      <div className="hero__inner shell">
        <div className="hero__lead">
          <span className="eyebrow eyebrow--accent">{profile.latinRoleLine}</span>

          <h1 className="hero__title">
            <span className="hero__title-cn">{profile.name}</span>
            <span className="hero__title-en">{profile.latin}</span>
          </h1>

          <p className="hero__lede">{profile.lede}</p>

          <div className="hero__actions">
            <a className="btn btn--primary" href={`mailto:${profile.email}`}>
              联系我
              <span className="btn__dot" aria-hidden="true" />
            </a>
            <a className="btn btn--ghost hero__btn-secondary" href="#works">
              <span className="hero__btn-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M6 12h11" strokeLinecap="round" />
                  <path d="M12.4 6.6 18 12l-5.6 5.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              查看精选项目
            </a>
          </div>
        </div>

        <aside className="hero__meta">
          <div className="hero__meta-block">
            <span className="eyebrow">Focus</span>
            <ul className="hero__roles">
              {profile.roles.map((role) => (
                <li key={role}>{role}</li>
              ))}
            </ul>
          </div>
          <div className="hero__meta-block">
            <span className="eyebrow">Currently</span>
            <p className="hero__meta-text">
              在泉州，做片子第八年。
              <br />
              可远程协作 / 可到岗。
            </p>
          </div>
          <div className="hero__meta-block">
            <span className="eyebrow">Contact</span>
            <a className="hero__meta-link" href={`tel:${profile.phone}`}>
              {profile.phone}
            </a>
            <a className="hero__meta-link" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          </div>
        </aside>
      </div>

      <div className="hero__footer">
        <div className="shell hero__footer-inner">
          <a className="hero__scroll" href="#about">
            <span className="hero__scroll-line" aria-hidden="true" />
            向下浏览 · Scroll
          </a>
          <div className="marquee hero__ticker">
            <div className="marquee__track">
              {[...ticker, ...ticker].map((item, index) => (
                <span key={`${item}-${index}`} className="hero__ticker-item">
                  {item}
                  <i aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
