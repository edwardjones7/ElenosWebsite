export function Nav() {
  return (
    <nav className="nav" data-nav>
      <a href="/" className="nav-brand" aria-label="Elenos home">
        <img className="nav-wordmark" src="/images/wordmark-white.png" alt="Elenos" />
      </a>
      <div className="nav-links">
        <a href="/work/">Work</a>
        <a href="/services/">Services</a>
        <a href="/about/">About</a>
        <a href="/products/">Products</a>
        <a href="/contact/">Contact</a>
      </div>
      <a
        className="nav-cta"
        href="https://calendly.com/ed-elenos/30min"
        target="_blank"
        rel="noopener"
        data-track="nav_calendly"
      >
        Book a call →
      </a>
      <button className="nav-toggle" aria-label="Toggle navigation">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
}
