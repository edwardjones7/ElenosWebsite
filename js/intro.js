// Elenos intro — minimal brand fade on first visit of a session.
(function () {
    try {
        if (sessionStorage.getItem('elenos-intro-played') === '1') return;
        sessionStorage.setItem('elenos-intro-played', '1');
    } catch (e) { /* storage disabled — still play */ }

    const overlay = document.createElement('div');
    overlay.className = 'intro-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
        <div class="intro-wordmark">
            <span class="intro-brand">ELENOS</span>
            <span class="intro-line"></span>
        </div>
    `;

    document.documentElement.classList.add('intro-active');

    const mount = () => {
        document.body.prepend(overlay);
        requestAnimationFrame(() => overlay.classList.add('in'));
        setTimeout(() => {
            overlay.classList.add('done');
            document.documentElement.classList.remove('intro-active');
            setTimeout(() => overlay.remove(), 700);
        }, 1600);
    };

    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount, { once: true });
})();
