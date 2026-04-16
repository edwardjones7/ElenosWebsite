// Per-section orb → iframe preview.
// Auto-opens when a work-section enters center viewport.
(function () {
    const sections = document.querySelectorAll('.work-section[data-preview-url]');
    if (!sections.length) return;

    // Reference desktop viewport we pretend to render the iframe at.
    const IFRAME_W = 1440;
    const IFRAME_H = 900;

    function updateIframeScale() {
        document.querySelectorAll('.work-preview').forEach((p) => {
            const w = p.offsetWidth;
            const h = p.offsetHeight - 24; // minus chrome
            if (w <= 0 || h <= 0) return;
            // "cover" fit — fills frame, may crop slightly vertically
            const scale = Math.max(w / IFRAME_W, h / IFRAME_H);
            p.style.setProperty('--iframe-scale', scale.toFixed(3));
        });
    }
    updateIframeScale();
    window.addEventListener('resize', updateIframeScale);
    window.addEventListener('load', updateIframeScale);

    // Open / close per section
    const OPEN_DELAY = 550; // orb pulses for ~0.55s before expanding
    const CLOSE_DELAY = 500;
    const timers = new WeakMap();

    function openPreview(section) {
        const preview = section.querySelector('.work-preview');
        if (!preview || preview.dataset.state === 'opening' || preview.dataset.state === 'open') return;

        // Cancel any pending close
        const t = timers.get(section);
        if (t) { clearTimeout(t); timers.delete(section); }

        preview.classList.add('visible');
        preview.dataset.state = 'opening';

        // Lazy-load iframe on first open
        const iframe = preview.querySelector('iframe');
        if (iframe && !iframe.dataset.loaded) {
            // Set src → browser starts loading
            iframe.src = iframe.dataset.src;
            iframe.dataset.loaded = 'true';
            // When loaded, remove shimmer
            const onLoad = () => {
                preview.classList.add('loaded');
                iframe.removeEventListener('load', onLoad);
            };
            iframe.addEventListener('load', onLoad);
            // Fallback — if load takes too long, hide shimmer anyway
            setTimeout(() => preview.classList.add('loaded'), 5000);
        }

        // Expand orb → frame after pulse
        const expandTimer = setTimeout(() => {
            preview.classList.add('open');
            preview.dataset.state = 'open';
        }, OPEN_DELAY);
        timers.set(section, expandTimer);
    }

    function closePreview(section) {
        const preview = section.querySelector('.work-preview');
        if (!preview) return;
        const state = preview.dataset.state;
        if (state !== 'open' && state !== 'opening') return;

        // Cancel pending open (if still in pulse phase)
        const t = timers.get(section);
        if (t) { clearTimeout(t); timers.delete(section); }

        preview.classList.remove('open');
        preview.dataset.state = 'closing';

        const closeTimer = setTimeout(() => {
            preview.classList.remove('visible');
            preview.classList.remove('loaded');
            preview.dataset.state = 'closed';
        }, CLOSE_DELAY);
        timers.set(section, closeTimer);
    }

    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.intersectionRatio > 0.4) {
                    openPreview(entry.target);
                } else if (entry.intersectionRatio < 0.15) {
                    closePreview(entry.target);
                }
            });
        },
        { threshold: [0, 0.15, 0.4, 0.65, 1] }
    );
    sections.forEach((s) => io.observe(s));
})();
