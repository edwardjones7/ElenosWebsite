// Blog post pages: reading progress and code highlighting.
(function () {
    const bar = document.querySelector('.read-progress span');
    const post = document.querySelector('.post');
    if (bar && post) {
        let queued = false;
        const update = () => {
            queued = false;
            const r = post.getBoundingClientRect();
            const span = r.height - innerHeight * 0.5;
            const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
            bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        };
        addEventListener('scroll', () => {
            if (!queued) { queued = true; requestAnimationFrame(update); }
        }, { passive: true });
        addEventListener('resize', update);
        update();
    }

    if (window.hljs) {
        document.querySelectorAll('.prose pre code').forEach((el) => window.hljs.highlightElement(el));
    }
})();
