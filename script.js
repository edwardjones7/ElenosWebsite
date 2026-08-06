// Shared site behavior — nav, mobile menu, active link, button hover, forms
(function () {
    const FORMSPREE_CONTACT = 'https://formspree.io/f/xrekvbqr';
    const API_BASE = (window.ELENOS_API_BASE || '').replace(/\/$/, '');

    // Cloudflare Turnstile site key. Public by design — the secret half lives on
    // the API. Leave empty to disable; the API also skips verification until its
    // own secret is set, so the forms keep working while keys are provisioned.
    // Set it here once for the whole site, or override per page with
    // window.ELENOS_TURNSTILE_SITE_KEY alongside window.ELENOS_API_BASE.
    const TURNSTILE_SITE_KEY = window.ELENOS_TURNSTILE_SITE_KEY || '0x4AAAAAAEIn_cvjSQADt9pj';

    function track(type, meta) {
        if (typeof window.elenosTrack === 'function') window.elenosTrack(type, meta || null);
    }

    /**
     * Turnstile tokens for the public forms.
     *
     * The honeypot and time-trap only exist inside a real browser, so they do
     * nothing against a script POSTing straight at the API — which is how our
     * forms were being used to bomb harvested addresses. A Turnstile token is
     * the one thing such a script can't manufacture.
     *
     * Widgets render in execute/interaction-only mode: invisible to nearly every
     * visitor, and only surfacing a challenge when Cloudflare wants one.
     */
    const turnstile = (function () {
        let apiPromise = null;
        const widgets = new WeakMap();

        function loadApi() {
            if (apiPromise) return apiPromise;
            apiPromise = new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
                s.async = true;
                s.defer = true;
                s.onload = resolve;
                s.onerror = () => reject(new Error('turnstile_unavailable'));
                document.head.appendChild(s);
            });
            return apiPromise;
        }

        function widgetFor(form) {
            let entry = widgets.get(form);
            if (entry) return entry;

            const holder = document.createElement('div');
            holder.className = 'turnstile-holder';
            form.appendChild(holder);

            entry = { pending: null };
            const settle = (value) => {
                const resolve = entry.pending;
                entry.pending = null;
                if (resolve) resolve(value);
            };
            entry.id = window.turnstile.render(holder, {
                sitekey: TURNSTILE_SITE_KEY,
                execution: 'execute',
                appearance: 'interaction-only',
                callback: (token) => settle(token || ''),
                'error-callback': () => settle(''),
                'expired-callback': () => settle(''),
            });

            widgets.set(form, entry);
            return entry;
        }

        /**
         * Resolve a fresh token for `form`, or '' when Turnstile is disabled or
         * unreachable. An empty token is not fatal on its own — the API decides
         * whether to accept it — so a Cloudflare outage degrades rather than
         * locking every visitor out of the form.
         */
        async function getToken(form) {
            if (!TURNSTILE_SITE_KEY || !form) return '';
            try {
                await loadApi();
            } catch (_) {
                return '';
            }
            if (!window.turnstile) return '';

            try {
                const entry = widgetFor(form);
                return await new Promise((resolve) => {
                    entry.pending = resolve;
                    window.turnstile.reset(entry.id);
                    window.turnstile.execute(entry.id);
                    // A challenge the visitor never completes must not wedge the
                    // submit button forever.
                    setTimeout(() => {
                        if (entry.pending === resolve) {
                            entry.pending = null;
                            resolve('');
                        }
                    }, 30000);
                });
            } catch (_) {
                return '';
            }
        }

        return { getToken };
    })();

    // /book and /learn load their own scripts after this one and post to the
    // same guarded endpoints.
    window.elenosTurnstile = turnstile;

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

    // CTA / booking click tracking
    document.querySelectorAll('a').forEach((a) => {
        const href = a.getAttribute('href') || '';
        // A booking link is the internal /book path (or any legacy Calendly URL).
        const isBooking = /\/book\/?($|[?#])/.test(href) || /calendly\.com/i.test(href);
        const isCta = a.classList.contains('btn-primary') || a.classList.contains('nav-cta');
        if (!isBooking && !isCta) return;
        a.addEventListener('click', () => {
            if (isBooking) track('book_click', { href });
            else track('cta_click', { href, label: (a.textContent || '').trim().slice(0, 60) });
        });
    });

    // Contact form (if present)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        // Time-trap start: first interaction with any field. The API requires a
        // plausible form_ms, so a script that posts the body cold is rejected.
        let contactStartedAt = 0;
        const markContactStart = () => { if (!contactStartedAt) contactStartedAt = performance.now(); };
        contactForm.addEventListener('focusin', markContactStart);
        contactForm.addEventListener('input', markContactStart);

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const status = document.getElementById('contact-status');
            const data = new FormData(contactForm);

            let ok = false;
            let blocked = false;
            if (API_BASE) {
                try {
                    const payload = {
                        name: data.get('name') || '',
                        email: data.get('email') || '',
                        company: data.get('company') || '',
                        project_type: data.get('project_type') || '',
                        message: data.get('message') || '',
                        source_path: location.pathname,
                        _gotcha: data.get('_gotcha') || '',
                        form_ms: contactStartedAt ? Math.round(performance.now() - contactStartedAt) : 0,
                        turnstile_token: await turnstile.getToken(contactForm),
                    };
                    const res = await fetch(API_BASE + '/api/contact/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    ok = res.ok;
                    // A failed challenge is the one rejection worth surfacing —
                    // falling through to Formspree would just resend the message.
                    blocked = res.status === 403;
                } catch (_) {
                    ok = false;
                }
            }

            if (blocked) {
                if (status) {
                    status.textContent = 'Verification failed — please try again.';
                    status.style.color = '#ff8a8a';
                }
                return;
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

    // Newsletter signup (footer, present on all pages)
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm && API_BASE) {
        const status = document.getElementById('newsletter-status');
        const input = document.getElementById('newsletter-email');
        const button = newsletterForm.querySelector('button[type="submit"]');
        const gotcha = newsletterForm.querySelector('input[name="_gotcha"]');
        // Time-trap start: first human interaction with the email field. The
        // API rejects submissions without a plausible form_ms.
        let startedAt = 0;
        const markStart = () => { if (!startedAt) startedAt = performance.now(); };
        if (input) {
            input.addEventListener('focus', markStart);
            input.addEventListener('input', markStart);
        }
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = (input && input.value || '').trim();
            if (!email) return;
            if (button) button.disabled = true;
            if (status) { status.textContent = 'Subscribing…'; status.style.color = ''; }
            try {
                const res = await fetch(API_BASE + '/api/subscribe/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        source_path: location.pathname,
                        _gotcha: (gotcha && gotcha.value) || '',
                        form_ms: startedAt ? Math.round(performance.now() - startedAt) : 0,
                        turnstile_token: await turnstile.getToken(newsletterForm),
                    }),
                });
                if (res.ok) {
                    if (status) { status.textContent = 'Subscribed. Thanks.'; status.style.color = '#6effbf'; }
                    newsletterForm.reset();
                    track('form_submit', { kind: 'newsletter' });
                } else {
                    const j = await res.json().catch(() => ({}));
                    let msg = 'Try again later.';
                    if (j && j.error === 'invalid_email') msg = 'Enter a valid email.';
                    else if (res.status === 403) msg = 'Verification failed — try again.';
                    if (status) { status.textContent = msg; status.style.color = '#ff8a8a'; }
                }
            } catch (_) {
                if (status) { status.textContent = 'Network error.'; status.style.color = '#ff8a8a'; }
            } finally {
                if (button) button.disabled = false;
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
