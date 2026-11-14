import SectionHead from "./SectionHead.jsx";
import { works } from "../data/site.js";
import "./Works.css";

export default function Works() {
  return (
    <section className="section works" id="works">
      <div className="shell">
        <SectionHead
          index="02"
          display="Selected Works"
          title="精选项目"
          eyebrow="Case Studies"
          meta={
            <>
              <span>{works.length} 个代表性项目</span>
              <span>新能源 / 城市文旅 / 企业品牌 / 科普教育</span>
            </>
          }
        />

        <div className="works__grid">
          {works.map((work, index) => (
            <article className="work" key={work.id}>
              <a className="work__link" href="#contact">
                <div className="plate__media work__media">
                  <div className="media__inner">
                    <img src={work.cover} alt={`${work.title} 项目画面`} loading="lazy" />
                  </div>
                  <span className="work__badge">{work.type}</span>
                </div>

                <div className="work__body">
                  <div className="work__head">
                    <span className="work__id">{work.id}</span>
                    <h3 className="work__title">{work.title}</h3>
                  </div>
                  <p className="work__latin">{work.latin}</p>
                  <ul className="work__tags">
                    {work.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                </div>

                <span className="work__arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </span>
              </a>
            </article>
          ))}
        </div>

        <p className="works__note">
          以上为部分代表作品，画面均来自成片截图；完整项目、成片链接与源文件可联系后提供。
        </p>
      </div>
    </section>
  );
}
