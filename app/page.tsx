import { Hero } from "./components/Hero";
import { ScrollReveal } from "./components/ScrollReveal";
import { RecentWorkFeed } from "./components/RecentWorkFeed";
import { getFeaturedWork } from "./lib/featured-work";

export default async function HomePage() {
  const writeups = await getFeaturedWork();

  return (
    <>
      <Hero writeups={writeups} />
      <ScrollReveal />

      {/* ============ pillars ============ */}
      <section className="block reveal" id="work" aria-labelledby="work-title">
        <div className="wrap">
          <div className="section-label">
            <span className="n">01</span>
            <h2 id="work-title">what i do</h2>
          </div>
          <div className="pillars">
            <article className="pillar" data-track="offense">
              <span className="num">01 / offense</span>
              <h3>break it first</h3>
              <div>
                <p className="detail">
                  pen testing, red team method, vulnerability research.
                  finding the variant nobody wrote up is the whole point.
                </p>
                <p className="tags">
                  <span>web app</span>
                  <span>ssrf</span>
                  <span>xss</span>
                  <span>burp</span>
                  <span>recon</span>
                </p>
              </div>
            </article>
            <article className="pillar" data-track="defense">
              <span className="num">02 / defense</span>
              <h3>hold the line</h3>
              <div>
                <p className="detail">
                  soc workflow, detection engineering, incident response.
                  an attack you can detect is an attack you can survive.
                </p>
                <p className="tags">
                  <span>siem</span>
                  <span>detection rules</span>
                  <span>ir playbooks</span>
                  <span>log analysis</span>
                </p>
              </div>
            </article>
            <article className="pillar" data-track="etc">
              <span className="num">03 / etc</span>
              <h3>build the tools</h3>
              <div>
                <p className="detail">
                  security tooling and automation. if i do a task twice,
                  the third time is a script.
                </p>
                <p className="tags">
                  <span>python</span>
                  <span>recon pipelines</span>
                  <span>agents</span>
                  <span>homelab</span>
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ============ recent work: featured from blog + projects ============ */}
      <RecentWorkFeed writeups={writeups} />

      {/* ============ about ============ */}
      <section className="block reveal" id="about" aria-labelledby="about-title">
        <div className="wrap">
          <div className="section-label">
            <span className="n">03</span>
            <h2 id="about-title">about</h2>
          </div>
          <div className="about-grid">
            <div className="about-copy">
              <p>
                i&apos;m adam <span className="take">竹内</span> takeuchi. self-taught, building
                full-time, betting on myself. i&apos;m not writing from the other side of
                anything. i&apos;m in the middle.
              </p>
              <p>
                the days split between two chairs. in one i hunt variants, catalogue
                bypasses, and write down what the scanner missed. in the other i turn
                those notes into detections so the next person on shift sees it coming.
              </p>
              <p className="about-quiet">
                <span className="take" lang="ja">安</span> &middot; security as a profession, security as a way of being.
              </p>
            </div>
            <div className="about-facts" aria-label="quick facts">
              <div className="fact">
                <span className="k">focus</span>
                <span className="v">appsec / detection</span>
              </div>
              <div className="fact">
                <span className="k">current lab</span>
                <span className="v">ssrf variant research</span>
              </div>
              <div className="fact">
                <span className="k">stack</span>
                <span className="v">burp, python, siem</span>
              </div>
              <div className="fact">
                <span className="k">status</span>
                <span className="v">open to analyst roles</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ contact ============ */}
      <section className="block reveal contact" id="contact" aria-labelledby="contact-title">
        <div className="wrap">
          <div className="section-label">
            <span className="n">04</span>
            <h2 id="contact-title">contact</h2>
          </div>
          <p className="big">
            have something that needs <strong>breaking</strong>, or holding together?
          </p>
          <div className="contact-links">
            <a className="text-link" href="/contact">
              email <span className="arrow" aria-hidden="true">&rarr;</span>
            </a>
            <a className="text-link" href="https://www.linkedin.com/in/adam-takeuchi/" target="_blank" rel="noopener noreferrer">
              linkedin <span className="arrow" aria-hidden="true">&rarr;</span>
            </a>
            <a className="text-link" href="https://github.com/amtakeuchi" target="_blank" rel="noopener noreferrer">
              github <span className="arrow" aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
