/**
 * 模块标题：英文大字 + 中文小标题 + 右侧备注 + 底部一条会被拉开的线。
 *
 * 结构固定，滚动动效由 useSiteMotion 按类名统一挂载。
 */
export default function SectionHead({ index, display, title, eyebrow, meta, compact = false }) {
  return (
    <header className={`section-head${compact ? " section-head--compact" : ""}`}>
      <span className="section-head__rule" aria-hidden="true" />

      <div className="section-head__left">
        <span className="section-head__index">{index}</span>
        <div className="section-head__titles">
          <h2 className="section-head__display">{display}</h2>
          <div className="section-head__sub">
            <span className="section-head__title">{title}</span>
            <span className="section-head__dot" aria-hidden="true" />
            <span className="eyebrow">{eyebrow}</span>
          </div>
        </div>
      </div>

      {meta ? <div className="section-head__meta">{meta}</div> : null}
    </header>
  );
}
