import Link from "next/link";
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
              <span className="num">01 /<br />offense</span>
              <h3>break it first</h3>
              <div>
                <p className="detail">
                  pen testing, red team methodology, vulnerability research, and threat
                  modeling. finding out how to break into the blind spots is the whole point.
                </p>
                <p className="tags">
                  <span>burp</span>
                  <span>recon</span>
                  <span>reverse engineering</span>
                  <span>exploit development</span>
                  <span>ai pentesting</span>
                </p>
              </div>
            </article>
            <article className="pillar" data-track="defense">
              <span className="num">02 /<br />defense</span>
              <h3>build it back</h3>
              <div>
                <p className="detail">
                  soc workflow, detection engineering, incident response, and overall
                  hardening. detect and defend against the attacks or be destroyed.
                </p>
                <p className="tags">
                  <span>siem</span>
                  <span>soar</span>
                  <span>detection rules</span>
                  <span>mitre att&amp;ck</span>
                  <span>incident response</span>
                </p>
              </div>
            </article>
            <article className="pillar" data-track="etc">
              <span className="num">03 /<br />etc</span>
              <h3>brainstorm it new</h3>
              <div>
                <p className="detail">
                  tools, automation, scripting, and documentation. if i have to do it
                  by hand, i&apos;ll make it easier for next time.
                </p>
                <p className="tags">
                  <span>python</span>
                  <span>osint</span>
                  <span>pipelines</span>
                  <span>agents</span>
                  <span>grc</span>
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
                i&apos;m adam. school got me in the door, i took it from there. building
                and breaking full-time. i&apos;m not reporting on this field from a
                distance. i&apos;m in it, figuring it out as i go.
              </p>
              <p>
                now, some are good at offense. some are good at defense. few are good
                at both. fewer still can translate tech talk into plain english, or
                into language people can act on.
              </p>
              <p>
                i want to know it all. how it works, what it can do, what it can&apos;t
                do, what breaks it, what it can be reborn as.
              </p>
              <p>
                <Link className="text-link" href="/about">
                  the full story <span className="arrow" aria-hidden="true">&rarr;</span>
                </Link>
              </p>
              <p className="about-quiet">
                <span className="take" lang="ja">安</span> &middot; security as a profession, security as a way of being.
              </p>
            </div>
            <div className="about-facts" aria-label="quick facts">
              <div className="fact">
                <span className="k">focus</span>
                <span className="v">web2 + web3 security / soc</span>
              </div>
              <div className="fact">
                <span className="k">current lab</span>
                <span className="v">soc lab with cloud integration, ai-assisted triage</span>
              </div>
              <div className="fact">
                <span className="k">stack</span>
                <span className="v">burp, python, siem, ollama</span>
              </div>
              <div className="fact">
                <span className="k">status</span>
                <span className="v">$ open to offers</span>
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
            something <strong>weird</strong>? something <strong>broken</strong>?
            something you can&apos;t <strong>explain</strong> to anyone else? send it over.
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
