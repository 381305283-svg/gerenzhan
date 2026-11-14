import SectionHead from "./SectionHead.jsx";
import { strengths, tools } from "../data/site.js";
import "./Strengths.css";

export default function Strengths() {
  return (
    <section className="section strengths" id="strengths">
      <div className="shell">
        <SectionHead
          index="03"
          display="Capabilities"
          title="个人优势"
          eyebrow="What I Do Best"
          meta={
            <>
              <span>一个人走完整条后期链路</span>
              <span>流程 / 审美 / 交付</span>
            </>
          }
        />

        <div className="strengths__grid">
          {strengths.map((item) => (
            <article className="strength" key={item.id}>
              <span className="strength__id">{item.id}</span>
              <h3 className="strength__title">{item.title}</h3>
              <span className="strength__latin">{item.latin}</span>
              <p className="strength__desc">{item.desc}</p>
              <ul className="strength__points">
                {item.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="strengths__tools">
          <div className="strengths__tools-head">
            <span className="eyebrow eyebrow--accent">Toolbox</span>
            <p>日常使用的软件与 AI 工具</p>
          </div>
          <ul className="strengths__tools-list">
            {tools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
