import "./Intro.css";

/** 首屏开场幕布。动效由 useOpening 统一编排。 */
export default function Intro({ hostRef }) {
  return (
    <div className="intro" ref={hostRef} aria-hidden="true">
      <div className="intro__inner">
        <span className="intro__mark">CE</span>
        <div className="intro__progress">
          <span className="intro__count">00</span>
          <span className="intro__bar">
            <i className="intro__bar-fill" />
          </span>
        </div>
        <div className="intro__meta">
          <span>陈希一 · CHEN XIYI</span>
          <span>VISUAL / AI / EDIT</span>
        </div>
      </div>
    </div>
  );
}
