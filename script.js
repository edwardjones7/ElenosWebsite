// Process section animation
function handleProcessAnimation() {
    const processSteps = document.querySelectorAll('.process-step');
    const processContainer = document.querySelector('.process-container');
    
    const processObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1
    });

    processSteps.forEach(step => {
        processObserver.observe(step);
    });

    // Observe the container for the progress bar
    const containerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                processContainer.classList.add('animate');
            }
        });
    }, {
        threshold: 0.1
    });

    containerObserver.observe(processContainer);
}

// Services section animation
function handleServicesAnimation() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1
    });

    serviceCards.forEach(card => {
        observer.observe(card);
    });
}

// Initialize both animations when page loads
document.addEventListener('DOMContentLoaded', () => {
    handleProcessAnimation();
    handleServicesAnimation();

    const track = document.querySelector('.clients-track');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');

    if (track && prevBtn && nextBtn) {
        const getScrollAmount = () => {
            const card = track.querySelector('.client-card');
            if (!card) return 0;
            const gap = parseFloat(getComputedStyle(track).gap) || 0;
            return card.offsetWidth + gap;
        };

        const updateButtons = () => {
            const maxScroll = track.scrollWidth - track.clientWidth;
            prevBtn.disabled = track.scrollLeft <= 0;
            nextBtn.disabled = track.scrollLeft >= maxScroll - 1;
        };

        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        });

        track.addEventListener('scroll', updateButtons);
        window.addEventListener('resize', updateButtons);
        updateButtons();
    }

    const starLayer = document.createElement('div');
    starLayer.className = 'mouse-stars';
    document.body.appendChild(starLayer);

    let lastStarTime = 0;
    const minInterval = 60;

    window.addEventListener('mousemove', (event) => {
        const now = Date.now();
        if (now - lastStarTime < minInterval) return;
        lastStarTime = now;

        const star = document.createElement('span');
        star.className = 'mouse-star';
        star.style.left = `${event.clientX}px`;
        star.style.top = `${event.clientY}px`;
        starLayer.appendChild(star);

        star.addEventListener('animationend', () => {
            star.remove();
        });
    });
}); 