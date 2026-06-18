import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Elenos — New Jersey Software, Web & AI Studio",
  description:
    "Elenos is a New Jersey software studio building websites, custom software, and AI systems for businesses across NJ that want to compound revenue.",
  alternates: { canonical: "https://elenos.ai/" },
  openGraph: {
    type: "website",
    siteName: "Elenos",
    title: "Elenos — New Jersey Software, Web & AI Studio",
    description:
      "Elenos is a New Jersey software studio building websites, custom software, and AI systems for businesses across NJ that want to compound revenue.",
    url: "https://elenos.ai/",
    images: [
      {
        url: "https://elenos.ai/images/og-cover.jpg",
        width: 1200,
        height: 630,
        alt: "Elenos — a New Jersey software studio building systems that compound revenue.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elenos — New Jersey Software, Web & AI Studio",
    description:
      "Elenos is a New Jersey software studio building websites, custom software, and AI systems for businesses across NJ that want to compound revenue.",
    images: ["https://elenos.ai/images/og-cover.jpg"],
  },
};

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-eyebrow reveal">
          <span className="eyebrow">Elenos / New Jersey Software Studio</span>
        </div>

        <h1 className="display display-hero home-hero-title reveal" data-delay="120">
          <span className="line">
            <span>We build the systems</span>
          </span>
          <span className="line">
            <span>
              that <em>compound</em> revenue.
            </span>
          </span>
        </h1>

        <div className="home-hero-sub reveal" data-delay="240">
          <p className="lede">
            A studio shipping cinematic websites, custom software, and AI systems for businesses
            that want to get out of their own way — and into their next trajectory.
          </p>
          <div className="home-hero-actions">
            <a
              className="btn btn-primary"
              href="https://calendly.com/ed-elenos/30min"
              target="_blank"
              rel="noopener"
              data-track="hero_calendly"
            >
              Book a discovery call <span className="btn-arrow">→</span>
            </a>
            <a className="btn btn-ghost" href="/work/">
              See our work <span className="btn-arrow">↓</span>
            </a>
          </div>
        </div>

        <div className="home-hero-meta reveal" data-delay="360">
          <div>
            <span className="mute">Studio</span>
            <b>Elenos Systems Co.</b>
          </div>
          <div>
            <span className="mute">Based</span>
            <b>New Jersey, USA</b>
          </div>
          <div>
            <span className="mute">Est.</span>
            <b>2025</b>
          </div>
          <div>
            <span className="mute">Status</span>
            <b>Accepting 2 projects · Q2/Q3</b>
          </div>
        </div>

        <div className="scroll-indicator" aria-hidden="true">
          SCROLL
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="manifesto">
        <div className="manifesto-head">
          <span className="eyebrow">01 / Thesis</span>
          <span className="section-number">Transmission 01.00</span>
        </div>
        <div className="manifesto-lines">
          <p data-lit>Most businesses don&apos;t have a revenue problem.</p>
          <p data-lit>
            They have a <em>systems</em> problem.
          </p>
          <p data-lit>Manual handoffs. Buried data. Tools that don&apos;t talk.</p>
          <p data-lit>Capital leaks quietly — day after day.</p>
          <p data-lit>Elenos builds the software that closes the leaks.</p>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="caps">
        <div className="caps-head reveal">
          <div>
            <span className="eyebrow">02 / Capabilities</span>
            <h2 className="display display-xl" style={{ marginTop: "1rem" }}>
              Four disciplines. One studio.
            </h2>
          </div>
          <p>
            Websites are the entry point. Custom software, AI integration, and systems audits are
            the deeper compound — each engagement builds on the last.
          </p>
        </div>
        <div className="disciplines">
          <a
            className="discipline reveal"
            href="/services/"
            data-delay="0"
            data-track="discipline_01"
          >
            <div className="d-meta">
              <span className="d-num">01</span>
              <span className="d-lane">Primary</span>
            </div>
            <div className="d-body">
              <h3 className="d-title">
                Websites &amp; <em>web apps</em>.
              </h3>
              <p className="d-desc">
                Cinematic marketing sites and production web apps. Brand system to deployment —
                engineered end-to-end, from first paint to final conversion.
              </p>
              <div className="d-tags">
                <span>Marketing sites</span>
                <span>Web apps</span>
                <span>Interactive</span>
                <span>SEO &amp; performance</span>
              </div>
            </div>
            <span className="d-arrow" aria-hidden="true">
              ↗
            </span>
          </a>

          <a
            className="discipline reveal"
            href="/services/"
            data-delay="80"
            data-track="discipline_02"
          >
            <div className="d-meta">
              <span className="d-num">02</span>
              <span className="d-lane">Scale</span>
            </div>
            <div className="d-body">
              <h3 className="d-title">
                Custom software &amp; <em>internal tools</em>.
              </h3>
              <p className="d-desc">
                CRMs, dashboards, booking and billing, internal admin. The operational software
                that replaces the spreadsheet stack and scales with the business.
              </p>
              <div className="d-tags">
                <span>CRMs</span>
                <span>Dashboards</span>
                <span>Admin &amp; tooling</span>
                <span>Data pipelines</span>
              </div>
            </div>
            <span className="d-arrow" aria-hidden="true">
              ↗
            </span>
          </a>

          <a
            className="discipline reveal"
            href="/services/"
            data-delay="160"
            data-track="discipline_03"
          >
            <div className="d-meta">
              <span className="d-num">03</span>
              <span className="d-lane">Intelligence</span>
            </div>
            <div className="d-body">
              <h3 className="d-title">
                AI integration &amp; <em>automation</em>.
              </h3>
              <p className="d-desc">
                AI operators and agentic workflows that retire the recurring manual task — not the
                human. Deployed inside a living business with the right guardrails.
              </p>
              <div className="d-tags">
                <span>AI operators</span>
                <span>Agents</span>
                <span>Workflow automation</span>
                <span>Internal AI</span>
              </div>
            </div>
            <span className="d-arrow" aria-hidden="true">
              ↗
            </span>
          </a>

          <a
            className="discipline reveal"
            href="/services/"
            data-delay="240"
            data-track="discipline_04"
          >
            <div className="d-meta">
              <span className="d-num">04</span>
              <span className="d-lane">Foundation</span>
            </div>
            <div className="d-body">
              <h3 className="d-title">
                Systems audits &amp; <em>consulting</em>.
              </h3>
              <p className="d-desc">
                Before we build, we diagnose. Manual handoffs, data silos, processes that don&apos;t
                scale — mapped, quantified, and prioritized into a build plan.
              </p>
              <div className="d-tags">
                <span>Revenue audits</span>
                <span>Process mapping</span>
                <span>Build roadmap</span>
                <span>Fractional CTO</span>
              </div>
            </div>
            <span className="d-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        </div>
      </section>

      {/* SELECTED WORK */}
      <section className="selected">
        <div className="selected-head reveal">
          <div>
            <span className="eyebrow">03 / Selected Transmissions</span>
            <h2 className="display display-xl" style={{ marginTop: "1rem" }}>
              A few systems we&apos;ve shipped.
            </h2>
          </div>
          <p className="mute">
            Scroll the full portfolio — each project is a planet in the Elenos system. Hit
            &quot;enter the portfolio&quot; for the journey.
          </p>
        </div>

        <div className="selected-grid">
          <a
            className="project reveal"
            href="/work/#ironbound"
            data-delay="0"
            data-preview-url="https://contractingwebsite.vercel.app/"
            data-track="project_ironbound"
          >
            <div className="project-preview">
              <iframe
                data-src="https://contractingwebsite.vercel.app/"
                title="Ironbound Roofing preview"
                sandbox="allow-same-origin allow-scripts"
                loading="lazy"
              ></iframe>
            </div>
            <div className="project-tint"></div>
            <div className="project-meta">
              <div>
                <div className="project-tag">Transmission 01 · Trades</div>
                <div className="project-name">Ironbound Roofing</div>
              </div>
              <div className="project-arrow">→</div>
            </div>
          </a>
          <a
            className="project reveal"
            href="/work/#sr71"
            data-delay="100"
            data-preview-url="https://jetstream-seven.vercel.app/"
            data-track="project_sr71"
          >
            <div className="project-preview">
              <iframe
                data-src="https://jetstream-seven.vercel.app/"
                title="SR-71 preview"
                sandbox="allow-same-origin allow-scripts"
                loading="lazy"
              ></iframe>
            </div>
            <div className="project-tint"></div>
            <div className="project-meta">
              <div>
                <div className="project-tag">Transmission 02 · Cinematic</div>
                <div className="project-name">SR-71</div>
              </div>
              <div className="project-arrow">→</div>
            </div>
          </a>
          <a
            className="project reveal"
            href="/work/#edthestatman"
            data-delay="200"
            data-preview-url="https://edthestatman.com"
            data-track="project_edthestatman"
          >
            <div className="project-preview">
              <iframe
                data-src="https://edthestatman.com"
                title="EdTheStatMan preview"
                sandbox="allow-same-origin allow-scripts"
                loading="lazy"
              ></iframe>
            </div>
            <div className="project-tint"></div>
            <div className="project-meta">
              <div>
                <div className="project-tag">Transmission 03 · Sports Betting</div>
                <div className="project-name">EdTheStatMan</div>
              </div>
              <div className="project-arrow">→</div>
            </div>
          </a>
          <a
            className="project reveal"
            href="/work/#alpha"
            data-delay="300"
            data-preview-url="https://edwardjones7.github.io/AlphaPainting/"
            data-track="project_alpha"
          >
            <div className="project-preview">
              <iframe
                data-src="https://edwardjones7.github.io/AlphaPainting/"
                title="Alpha Painting preview"
                sandbox="allow-same-origin allow-scripts"
                loading="lazy"
              ></iframe>
            </div>
            <div className="project-tint"></div>
            <div className="project-meta">
              <div>
                <div className="project-tag">Transmission 04 · Trades</div>
                <div className="project-name">Alpha Painting</div>
              </div>
              <div className="project-arrow">→</div>
            </div>
          </a>
          <a
            className="project reveal"
            href="/work/#sheriff"
            data-delay="400"
            data-preview-url="https://the-solana-sheriff.vercel.app/"
            data-track="project_sheriff"
          >
            <div className="project-preview">
              <iframe
                data-src="https://the-solana-sheriff.vercel.app/"
                title="The Solana Sheriff preview"
                sandbox="allow-same-origin allow-scripts"
                loading="lazy"
              ></iframe>
            </div>
            <div className="project-tint"></div>
            <div className="project-meta">
              <div>
                <div className="project-tag">Transmission 05 · Crypto / AI</div>
                <div className="project-name">The Solana Sheriff</div>
              </div>
              <div className="project-arrow">→</div>
            </div>
          </a>
        </div>

        <div className="selected-cta reveal">
          <a className="btn btn-primary" href="/work/" data-track="enter_portfolio">
            Enter the portfolio <span className="btn-arrow">→</span>
          </a>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="principles">
        <div className="principles-head reveal">
          <span className="eyebrow">04 / Principles</span>
          <h2 className="display display-lg" style={{ marginTop: "1rem" }}>
            How we work when it matters.
          </h2>
        </div>
        <div className="principle-grid">
          <div className="principle reveal" data-delay="0">
            <div className="principle-num">P / 01</div>
            <h3>Craft.</h3>
            <p>
              Pixels and servers and copy and conversion. Every surface gets treated like it&apos;s
              the first thing a customer sees — because somewhere, it is.
            </p>
          </div>
          <div className="principle reveal" data-delay="100">
            <div className="principle-num">P / 02</div>
            <h3>Compound.</h3>
            <p>
              We don&apos;t ship one-offs. Each engagement is designed to feed the next — a
              workflow becomes a feature becomes a reusable operator.
            </p>
          </div>
          <div className="principle reveal" data-delay="200">
            <div className="principle-num">P / 03</div>
            <h3>Ship.</h3>
            <p>
              Beautiful work that doesn&apos;t ship isn&apos;t work. We default to production,
              measure in revenue impact, and build for what lasts.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="final-cta-glow" aria-hidden="true"></div>
        <span className="eyebrow">05 / Your System Is Next</span>
        <h2 className="display display-xl reveal">
          Let&apos;s build something
          <br />
          that compounds.
        </h2>
        <p className="reveal" data-delay="120">
          A 30-minute discovery call is free. We&apos;ll diagnose the leaks, sketch a system, and
          tell you if we&apos;re the right studio to build it.
        </p>
        <a
          className="btn btn-primary reveal"
          data-delay="200"
          href="https://calendly.com/ed-elenos/30min"
          target="_blank"
          rel="noopener"
          data-track="final_cta_calendly"
        >
          Book a discovery call <span className="btn-arrow">→</span>
        </a>
      </section>

      {/* Per-page scene scripts — rendered after layout's CDN libs + scroll.js */}
      <Script src="/js/scene.js" strategy="afterInteractive" />
      <Script src="/js/cursor-stars.js" strategy="afterInteractive" />
      <Script src="/js/home-projects.js" strategy="afterInteractive" />
    </>
  );
}
