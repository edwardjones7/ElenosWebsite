// /learn funnel — UTM capture + lead form submission.
// Both forms on the page share this handler; success swaps the card content.
(function () {
    const API_BASE = (window.ELENOS_API_BASE || '').replace(/\/$/, '');

    function track(type, meta) {
        if (typeof window.elenosTrack === 'function') window.elenosTrack(type, meta || null);
    }

    // --- UTM capture -------------------------------------------------------
    // First-touch wins for the session; survives reloads while they read.
    // `?s=tiktok` is accepted as shorthand for `?utm_source=tiktok`.
    const UTM_KEY = 'el_utm';
    function readUtm() {
        try {
            const stored = sessionStorage.getItem(UTM_KEY);
            if (stored) return JSON.parse(stored);
        } catch (_) { /* storage unavailable — fall through */ }

        const q = new URLSearchParams(location.search);
        const utm = {
            utm_source: q.get('utm_source') || q.get('s') || '',
            utm_medium: q.get('utm_medium') || '',
            utm_campaign: q.get('utm_campaign') || '',
        };
        if (utm.utm_source || utm.utm_medium || utm.utm_campaign) {
            try { sessionStorage.setItem(UTM_KEY, JSON.stringify(utm)); } catch (_) {}
        }
        return utm;
    }
    const utm = readUtm();

    // --- Lead forms --------------------------------------------------------
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const DISCORD_INVITE = 'https://discord.gg/UH3a34eUvd';

    function successMarkup(discordUrl) {
        const invite = discordUrl || DISCORD_INVITE;
        return (
            '<div class="lead-success">' +
            '<span class="lead-success-mark" aria-hidden="true">✓</span>' +
            '<h3>Check your inbox.</h3>' +
            '<p>The guide is on the way. No email in a few minutes? Check spam, or write <a href="mailto:ed@elenos.ai">ed@elenos.ai</a>.</p>' +
            '<a class="btn btn-primary" href="' + invite + '" target="_blank" rel="noopener">Join the Discord now <span class="btn-arrow">→</span></a>' +
            '</div>'
        );
    }

    document.querySelectorAll('.lead-form').forEach((form) => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const status = form.querySelector('.lead-status');
            const button = form.querySelector('button[type="submit"]');
            const name = (form.elements.name.value || '').trim();
            const email = (form.elements.email.value || '').trim();

            if (!name) {
                if (status) { status.textContent = 'What should we call you?'; status.style.color = '#ff8a8a'; }
                return;
            }
            if (!EMAIL_RE.test(email)) {
                if (status) { status.textContent = 'Enter a valid email.'; status.style.color = '#ff8a8a'; }
                return;
            }

            if (button) button.disabled = true;
            if (status) { status.textContent = 'Unlocking…'; status.style.color = ''; }

            let res = null;
            let body = {};
            try {
                res = await fetch(API_BASE + '/api/lead/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        source_path: location.pathname + location.search,
                        utm_source: utm.utm_source,
                        utm_medium: utm.utm_medium,
                        utm_campaign: utm.utm_campaign,
                    }),
                });
                body = await res.json().catch(() => ({}));
            } catch (_) { /* network error — handled below */ }

            if (res && res.ok) {
                const card = form.closest('.learn-card');
                const html = successMarkup(body.emailed === false ? body.discord_invite : null);
                if (card) card.innerHTML = html;
                else form.outerHTML = html;
                track('form_submit', { kind: 'lead', utm_source: utm.utm_source || null });
            } else {
                const msg = body && body.error === 'invalid_email'
                    ? 'Enter a valid email.'
                    : 'Something broke on our end. Email ed@elenos.ai and we’ll send it directly.';
                if (status) { status.textContent = msg; status.style.color = '#ff8a8a'; }
                if (button) button.disabled = false;
            }
        });
    });
})();
