// Shared site behavior — nav, mobile menu, active link, button hover, forms
(function () {
    const FORMSPREE_CONTACT = 'https://formspree.io/f/xrekvbqr';

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

    // Active nav link
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav-links a').forEach((a) => {
        const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
        if (href && href === path) a.classList.add('active');
        if (path === '' && href === 'index.html') a.classList.add('active');
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

    // Contact form (if present)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const status = document.getElementById('contact-status');
            const data = new FormData(contactForm);
            try {
                const res = await fetch(FORMSPREE_CONTACT, {
                    method: 'POST',
                    body: data,
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) {
                    if (status) {
                        status.textContent = 'Transmission received. We will respond within 1–2 business days.';
                        status.style.color = '#6effbf';
                    }
                    contactForm.reset();
                } else {
                    throw new Error('bad response');
                }
            } catch (err) {
                if (status) {
                    status.textContent = 'Transmission failed. Email ed@elenos.ai directly.';
                    status.style.color = '#ff6868';
                }
            }
        });
    }

    // Footer year
    const year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
})();
