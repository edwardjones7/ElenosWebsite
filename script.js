// Shared site behavior — nav, mobile menu, active link, button hover, forms
(function () {
    const FORMSPREE_CONTACT = 'https://formspree.io/f/xrekvbqr';
    const API_BASE = (window.ELENOS_API_BASE || '').replace(/\/$/, '');

    function track(type, meta) {
        if (typeof window.elenosTrack === 'function') window.elenosTrack(type, meta || null);
    }

    // Nav — auto-hide on downward scroll, reveal on upward scroll
    const nav = document.querySelector('.nav');
    if (nav) {
        let lastY = window.scrollY;
        let hidden = false;
        const threshold = 8;
        const onScroll = () => {
            const y = window.scrollY;
            const delta = y - lastY;
            // Near the top — always show
            if (y < 40) {
                if (hidden) { nav.dataset.hidden = 'false'; hidden = false; }
            } else if (delta > threshold && !hidden) {
                // Scrolling down — hide
                nav.dataset.hidden = 'true';
                hidden = true;
            } else if (delta < -threshold && hidden) {
                // Scrolling up — show
                nav.dataset.hidden = 'false';
                hidden = false;
            }
            lastY = y;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Mobile nav toggle
    const toggle = document.querySelector('.nav-toggle');
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const open = nav.dataset.open === 'true';
            const next = open ? 'false' : 'true';
            nav.dataset.open = next;
            toggle.dataset.open = next;
            document.body.style.overflow = next === 'true' ? 'hidden' : '';
        });

        // Close on link click (mobile)
        document.querySelectorAll('.nav-links a').forEach((a) => {
            a.addEventListener('click', () => {
                nav.dataset.open = 'false';
                toggle.dataset.open = 'false';
                document.body.style.overflow = '';
            });
        });
    }

    // Active nav link — match first path segment (e.g. /work/ → "work")
    const pathSeg = (location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
    document.querySelectorAll('.nav-links a').forEach((a) => {
        const hrefSeg = ((a.getAttribute('href') || '').split('/').filter(Boolean)[0] || '').toLowerCase();
        if (pathSeg === hrefSeg) a.classList.add('active');
    });

    // Page fade-in
    window.addEventListener('load', () => {
        document.querySelectorAll('.page-fade').forEach((el) => el.classList.add('in'));
    });

    // Button radial hover
    document.querySelectorAll('.btn').forEach((btn) => {
        btn.addEventListener('mousemove', (e) => {
            const r = btn.getBoundingClientRect();
            btn.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
            btn.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
        });
    });

    // CTA / Calendly click tracking
    document.querySelectorAll('a').forEach((a) => {
        const href = a.getAttribute('href') || '';
        const isCalendly = /calendly\.com/i.test(href);
        const isCta = a.classList.contains('btn-primary') || a.classList.contains('nav-cta');
        if (!isCalendly && !isCta) return;
        a.addEventListener('click', () => {
            if (isCalendly) track('calendly_click', { href });
            else track('cta_click', { href, label: (a.textContent || '').trim().slice(0, 60) });
        });
    });

    // Contact form (if present)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const status = document.getElementById('contact-status');
            const data = new FormData(contactForm);

            let ok = false;
            if (API_BASE) {
                try {
                    const payload = {
                        name: data.get('name') || '',
                        email: data.get('email') || '',
                        company: data.get('company') || '',
                        project_type: data.get('project_type') || '',
                        message: data.get('message') || '',
                        source_path: location.pathname,
                    };
                    const res = await fetch(API_BASE + '/api/contact/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    ok = res.ok;
                } catch (_) {
                    ok = false;
                }
            }

            if (!ok) {
                try {
                    const res = await fetch(FORMSPREE_CONTACT, {
                        method: 'POST',
                        body: data,
                        headers: { Accept: 'application/json' },
                    });
                    ok = res.ok;
                } catch (_) {
                    ok = false;
                }
            }

            if (ok) {
                if (status) {
                    status.textContent = 'Thanks — we’ll respond within 1–2 business days.';
                    status.style.color = '#6effbf';
                }
                contactForm.reset();
                track('form_submit');
            } else {
                if (status) {
                    status.textContent = 'Submission failed. Email ed@elenos.ai directly.';
                    status.style.color = '#ff6868';
                }
            }
        });
    }

    // Product image fallback for missing assets
    document.querySelectorAll('.product-visual img').forEach((img) => {
        const parent = img.closest('.product-visual');
        img.addEventListener('load', () => {
            if (parent) parent.dataset.fallback = '';
        });
        img.addEventListener('error', () => {
            img.style.display = 'none';
            if (parent) parent.dataset.fallback = img.alt || 'Preview unavailable';
        });
    });

    // Footer year
    const year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
})();
