import Script from "next/script";
import type { ReactNode } from "react";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Fonts + FontAwesome + legacy stylesheets — rendered into <head> by Next */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,50..100;1,9..144,300..700,50..100&family=Barlow:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <link rel="stylesheet" href="/styles.css" />
      <link rel="stylesheet" href="/styles-pages.css" />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
      />

      {/* Intro overlay — runs before paint to suppress flash. Plain script tag
          (not next/script) to keep the original synchronous-in-head behavior. */}
      <Script id="elenos-intro" src="/js/intro.js" strategy="beforeInteractive" />

      {/* tracker queue stub — eliminates race between hydration and early clicks.
          tracker.js (Phase 3) will replace this function and drain the queue. */}
      <Script id="elenos-track-stub" strategy="beforeInteractive">
        {`window.elenosTrack = (...a) => (window.__elenosQueue ||= []).push(a);`}
      </Script>

      <canvas id="scene-canvas" className="scene-canvas" aria-hidden="true"></canvas>

      <Nav />

      <main className="shell page-fade">{children}</main>

      <Footer />

      {/* Libraries (CDN) */}
      <Script
        src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/lenis@1.0.45/dist/lenis.min.js"
        strategy="afterInteractive"
      />

      {/* Shared app scripts. Per-page scene scripts are rendered by each page. */}
      <Script src="/script.js" strategy="afterInteractive" />
      <Script src="/js/scroll.js" strategy="afterInteractive" />
    </>
  );
}
