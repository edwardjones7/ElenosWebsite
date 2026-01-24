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

// Set active nav link based on current page
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Mouse star tracking effect - initialize early to work on all pages
(function initMouseStars() {
    let starLayer = null;
    let lastStarTime = 0;
    const minInterval = 50; // Reduced interval for more stars
    let mousemoveHandler = null;

    function ensureStarLayer() {
        if (!starLayer) {
            starLayer = document.querySelector('.mouse-stars');
            if (!starLayer) {
                starLayer = document.createElement('div');
                starLayer.className = 'mouse-stars';
            }
            if (document.body && !document.body.contains(starLayer)) {
                document.body.appendChild(starLayer);
            }
        }
        return starLayer;
    }

    function createStar(x, y) {
        const layer = ensureStarLayer();
        if (!layer) return;
        const star = document.createElement('span');
        star.className = 'mouse-star';
        star.style.left = `${x}px`;
        star.style.top = `${y}px`;
        layer.appendChild(star);

        star.addEventListener('animationend', () => {
            star.remove();
        });
    }

    function handleMouseMove(event) {
        const now = Date.now();
        if (now - lastStarTime < minInterval) return;
        lastStarTime = now;
        createStar(event.clientX, event.clientY);
    }

    function setupMouseStars() {
        ensureStarLayer();
        if (!mousemoveHandler) {
            mousemoveHandler = handleMouseMove;
            window.addEventListener('mousemove', mousemoveHandler);
        }
    }

    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupMouseStars);
    } else {
        setupMouseStars();
    }
})();

// Waitlist form functionality
(function() {
    function setupWaitlistForm() {
        const joinBtn = document.getElementById('join-waitlist-btn');
        const waitlistForm = document.getElementById('waitlist-form');
        const waitlistFormElement = document.getElementById('waitlist-form-element');
        const emailInput = document.getElementById('waitlist-email');

        if (!joinBtn || !waitlistForm) {
            return;
        }

        joinBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            waitlistForm.style.display = 'block';
            joinBtn.style.display = 'none';
            setTimeout(() => {
                if (emailInput) {
                    emailInput.focus();
                }
            }, 100);
        });

        if (waitlistFormElement && emailInput) {
            waitlistFormElement.addEventListener('submit', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const email = emailInput.value.trim();
                if (email) {
                    // Disable submit button during submission
                    const submitBtn = waitlistFormElement.querySelector('button[type="submit"]');
                    const originalText = submitBtn.textContent;
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Submitting...';

                    // Send email to server
                    fetch('http://localhost:3000/api/waitlist', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email: email })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Thank you! We\'ll notify you when Assistant+ is ready.');
                            waitlistFormElement.reset();
                            waitlistForm.style.display = 'none';
                            joinBtn.style.display = 'inline-flex';
                        } else {
                            alert('There was an error. Please try again.');
                            submitBtn.disabled = false;
                            submitBtn.textContent = originalText;
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('There was an error saving your email. Please try again.');
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    });
                }
            });
        }
    }

    // Try multiple initialization points
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupWaitlistForm);
    } else {
        setupWaitlistForm();
    }
    
    window.addEventListener('load', setupWaitlistForm);
})();

// Initialize both animations when page loads
document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
    handleProcessAnimation();
    handleServicesAnimation();
}); 