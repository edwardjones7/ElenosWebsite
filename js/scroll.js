// Lenis smooth scroll + reveal observers (shared across pages)
(function () {
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Lenis smooth scroll
    if (typeof Lenis !== 'undefined' && !prefersReduce) {
        const lenis = new Lenis({
            lerp: 0.09,
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 1.2,
        });
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        window.__lenis = lenis;

        // Sync with GSAP ScrollTrigger if loaded
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => {
                lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);
        }

        // Anchor link scrolling via lenis
        document.querySelectorAll('a[href^="#"]').forEach((a) => {
            a.addEventListener('click', (e) => {
                const target = document.querySelector(a.getAttribute('href'));
                if (!target) return;
                e.preventDefault();
                lenis.scrollTo(target, { offset: -80 });
            });
        });
    }

    // Reveal on scroll
    const revealEls = document.querySelectorAll('.reveal, [data-reveal]');
    if ('IntersectionObserver' in window && revealEls.length) {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const delay = parseInt(el.dataset.delay || 0, 10);
                        setTimeout(() => el.classList.add('in'), delay);
                        io.unobserve(el);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
        );
        revealEls.forEach((el) => io.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('in'));
    }

    // "lit" lines for manifestos & long-form
    const litLines = document.querySelectorAll('[data-lit]');
    if ('IntersectionObserver' in window && litLines.length) {
        const lio = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) entry.target.classList.add('lit');
                });
            },
            { threshold: 0.75 }
        );
        litLines.forEach((el) => lio.observe(el));
    }
})();
