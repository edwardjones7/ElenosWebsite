// Home "selected work" grid — lazy-load live iframe previews when tiles
// scroll into view, and scale each iframe to show a desktop viewport.
(function () {
    const projects = document.querySelectorAll('.selected-grid .project[data-preview-url]');
    if (!projects.length) return;

    const IFRAME_W = 1440;
    const IFRAME_H = 900;

    function setScale() {
        projects.forEach((p) => {
            const preview = p.querySelector('.project-preview');
            if (!preview) return;
            const w = preview.offsetWidth;
            const h = preview.offsetHeight;
            if (w <= 0 || h <= 0) return;
            // cover — fills the tile, may crop slightly
            const scale = Math.max(w / IFRAME_W, h / IFRAME_H);
            preview.style.setProperty('--iframe-scale', scale.toFixed(3));
        });
    }
    setScale();
    window.addEventListener('resize', setScale);
    window.addEventListener('load', setScale);

    // Lazy-load iframes as tiles approach the viewport (200px rootMargin
    // so content is ready just before the tile lands in view).
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const iframe = entry.target.querySelector('iframe');
                if (iframe && !iframe.dataset.loaded) {
                    iframe.src = iframe.dataset.src;
                    iframe.addEventListener(
                        'load',
                        () => { iframe.dataset.loaded = 'true'; },
                        { once: true }
                    );
                }
                io.unobserve(entry.target);
            });
        },
        { threshold: 0.1, rootMargin: '200px 0px' }
    );
    projects.forEach((p) => io.observe(p));
})();
