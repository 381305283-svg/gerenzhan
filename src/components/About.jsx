import SectionHead from "./SectionHead.jsx";
import { asset, education, experience, profile, stats } from "../data/site.js";
import "./About.css";

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="shell">
        <SectionHead
          index="01"
          display="Profile"
          title="个人经历"
          eyebrow="About / Resume"
          meta={
            <>
              <span>{profile.target}</span>
              <span>
                {profile.city} · {profile.height} · {profile.birth}
              </span>
            </>
          }
        />

        <div className="about__body">
          <div className="about__left">
            <figure className="plate about__portrait">
              <div className="plate__media about__portrait-media">
                <div className="media__inner">
                  <img
                    src={asset("media/character-ip-keyvisual.jpg")}
                    alt="CE 角色形象主视觉：戴监听耳机的白色小狗在剪辑时间线前"
                  />
                </div>
              </div>
              <figcaption className="plate__caption">
                <span>CE · Character IP</span>
                <span>Key Visual</span>
              </figcaption>
            </figure>

            <dl className="about__facts">
              <div>
                <dt>姓名</dt>
                <dd>
                  {profile.name} <em>{profile.latin}</em>
                </dd>
              </div>
              <div>
                <dt>现居</dt>
                <dd>{profile.city}</dd>
              </div>
              <div>
                <dt>学历</dt>
                <dd>{profile.education}</dd>
              </div>
              <div>
                <dt>期望</dt>
                <dd>
                  {profile.target} · {profile.salary}
                </dd>
              </div>
            </dl>

            <div className="about__contact">
              <a href={`tel:${profile.phone}`}>
                <span className="eyebrow">Phone</span>
                <strong>{profile.phone}</strong>
              </a>
              <a href={`mailto:${profile.email}`}>
                <span className="eyebrow">Email</span>
                <strong>{profile.email}</strong>
              </a>
              <div>
                <span className="eyebrow">Address</span>
                <strong>{profile.address}</strong>
              </div>
            </div>
          </div>

          <div className="about__right">
            <div className="about__intro">
              {profile.intro.map((paragraph) => (
                <p key={paragraph.slice(0, 12)}>{paragraph}</p>
              ))}
            </div>

            <div className="about__stats">
              {stats.map((item) => (
                <div className="stat" key={item.label}>
                  <span className="stat__value">
                    {item.value}
                    <i>{item.unit}</i>
                  </span>
                  <span className="stat__label">{item.label}</span>
                  <span className="stat__note">{item.note}</span>
                </div>
              ))}
            </div>

            <div className="about__timeline">
              <div className="about__timeline-head">
                <span className="eyebrow eyebrow--accent">Work Experience</span>
                <span className="about__timeline-count">{experience.length} 段经历</span>
              </div>

              <ul>
                {experience.map((item) => (
                  <li key={item.company} className="xp">
                    <span className="xp__period">{item.period}</span>
                    <div className="xp__main">
                      <div className="xp__heading">
                        <h3>{item.company}</h3>
                        <span>{item.role}</span>
                      </div>
                      <ul className="xp__points">
                        {item.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
                {education.map((item) => (
                  <li key={item.school} className="xp xp--edu">
                    <span className="xp__period">{item.period}</span>
                    <div className="xp__main">
                      <div className="xp__heading">
                        <h3>{item.school}</h3>
                        <span>{item.major}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="about__ip">
          <div className="about__ip-copy">
            <span className="eyebrow eyebrow--accent">Character IP</span>
            <h3>CE — 我为自己的内容设计的角色形象</h3>
            <p>
              白色毛球、监听耳机、黑莓色机能外套，加上一点高饱和的品红。它是我作品里的固定主角，
              也是这套视觉语言的来源：暗底、克制的灰阶，和一处必须精准的亮色。
            </p>
            <ul className="about__ip-meta">
              <li>
                <span>Front / Side / Back</span>三视图设定
              </li>
              <li>
                <span>Palette</span>#0A050A · #2A0B24 · #FF3DA6
              </li>
            </ul>
          </div>
          <figure className="plate about__ip-plate">
            <div className="plate__media about__ip-media">
              <div className="media__inner">
                <img src={asset("media/character-sheet.png")} alt="CE 角色三视图设定稿" />
              </div>
            </div>
            <figcaption className="plate__caption">
              <span>Character Turnaround</span>
              <span>正 / 侧 / 背</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
