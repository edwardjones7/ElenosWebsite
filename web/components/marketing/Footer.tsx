export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img className="footer-wordmark" src="/images/wordmark-white.png" alt="Elenos" />
          <p>
            A New Jersey software studio building websites, custom systems, and AI operators for
            compounding businesses. Serving businesses across New Jersey and the USA.
          </p>
        </div>
        <div className="footer-col">
          <h5>Studio</h5>
          <ul>
            <li><a href="/work/">Work</a></li>
            <li><a href="/services/">Services</a></li>
            <li><a href="/about/">About</a></li>
            <li><a href="/products/">Products</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Contact</h5>
          <ul>
            <li>
              <a
                href="https://calendly.com/ed-elenos/30min"
                target="_blank"
                rel="noopener"
                data-track="footer_calendly"
              >
                Book a call
              </a>
            </li>
            <li><a href="/contact/">Start a project</a></li>
            <li><a href="mailto:ed@elenos.ai">ed@elenos.ai</a></li>
            <li><a href="tel:+18564421180">Call: (856) 442-1180</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Signal</h5>
          <ul>
            <li>
              <a href="https://www.instagram.com/elenos.ai" target="_blank" rel="noopener">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://x.com/elenos_ai" target="_blank" rel="noopener">
                X / Twitter
              </a>
            </li>
            <li>
              <a href="https://discord.gg/UH3a34eUvd" target="_blank" rel="noopener">
                Discord
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © <span data-year>2026</span> ELENOS SYSTEMS CO. · ALL RIGHTS RESERVED
        </span>
        <span>elenos.ai</span>
      </div>
    </footer>
  );
}
