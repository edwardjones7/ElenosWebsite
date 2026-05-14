// Tiny-star cursor trail — ambient, matches the 3D starfield palette.
// Desktop-only, respects reduced-motion.
(function () {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const container = document.createElement('div');
    container.className = 'star-trail';
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);

    // Palette matches the Three.js starfield (starsFar #ffffff, starsMid #d8c4ff).
    const palette = ['#ffffff', '#e8dcff', '#d8c4ff'];

    let lastSpawn = 0;
    const INTERVAL = 32;

    window.addEventListener('mousemove', (e) => {
        const now = performance.now();
        if (now - lastSpawn < INTERVAL) return;
        lastSpawn = now;

        const color = palette[Math.floor(Math.random() * palette.length)];
        const size = 2 + Math.random() * 2;           // 2–4 px
        const jitterX = (Math.random() - 0.5) * 16;   // ±8 px
        const jitterY = (Math.random() - 0.5) * 16;
        const driftX = (Math.random() - 0.5) * 28;    // ±14 px
        const driftY = (Math.random() - 0.5) * 28 - 4;

        const dot = document.createElement('div');
        dot.className = 'star-trail-dot';
        dot.style.left = (e.clientX + jitterX) + 'px';
        dot.style.top = (e.clientY + jitterY) + 'px';
        dot.style.width = size + 'px';
        dot.style.height = size + 'px';
        dot.style.color = color;
        dot.style.background = color;
        dot.style.setProperty('--dx', driftX + 'px');
        dot.style.setProperty('--dy', driftY + 'px');
        container.appendChild(dot);

        setTimeout(() => dot.remove(), 950);
    }, { passive: true });
})();
