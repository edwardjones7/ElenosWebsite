// Form submissions: use Formspree so CSV/data is saved without running a server.
// 1. Sign up at https://formspree.io and create two forms (Contact + Waitlist).
// 2. Replace the IDs below with your form IDs (e.g. xyzabc from https://formspree.io/f/xyzabc).
// 3. In Formspree dashboard you can export submissions as CSV.
const FORMSPREE_CONTACT = 'https://formspree.io/f/YOUR_CONTACT_FORM_ID';
const FORMSPREE_WAITLIST = 'https://formspree.io/f/YOUR_WAITLIST_FORM_ID';

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

                    // Send email to Formspree (no server to run; export CSV from Formspree dashboard)
                    fetch(FORMSPREE_WAITLIST, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email: email })
                    })
                    .then(response => response.json().then(data => ({ ok: response.ok, data })))
                    .then(({ ok }) => {
                        if (ok) {
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

// Contact form functionality
(function() {
    function setupContactForm() {
        const contactForm = document.querySelector('.project-form-modern');
        
        if (!contactForm) {
            return;
        }

        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Get form data
            const formData = {
                name: document.getElementById('name')?.value.trim() || '',
                email: document.getElementById('email')?.value.trim() || '',
                company: document.getElementById('company')?.value.trim() || '',
                service: document.getElementById('service')?.value || '',
                timeline: document.getElementById('timeline')?.value || '',
                budget: document.getElementById('budget')?.value || '',
                details: document.getElementById('details')?.value.trim() || ''
            };

            // Validate required fields
            if (!formData.name || !formData.email || !formData.details) {
                alert('Please fill in all required fields (Name, Email, and Project Details).');
                return;
            }

            if (!formData.email.includes('@')) {
                alert('Please enter a valid email address.');
                return;
            }

            // Disable submit button during submission
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            // Send form data to Formspree (no server to run; export CSV from Formspree dashboard)
            fetch(FORMSPREE_CONTACT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json().then(data => ({ ok: response.ok, data })))
            .then(({ ok, data }) => {
                if (ok) {
                    alert('Thank you! We\'ve received your project request and will review it within 1-2 business days.');
                    contactForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Request';
                } else {
                    alert(data.error || 'There was an error submitting your request. Please try again.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Request';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('There was an error submitting your request. Please try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            });
        });
    }

    // Try multiple initialization points
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupContactForm);
    } else {
        setupContactForm();
    }
    
    window.addEventListener('load', setupContactForm);
})();

// Mobile menu toggle functionality
(function() {
    function setupMobileMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (!menuToggle || !navLinks) {
            return;
        }
        
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        navLinks.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
        
        document.addEventListener('click', function(e) {
            if (!navLinks.classList.contains('active')) return;
            if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupMobileMenu);
    } else {
        setupMobileMenu();
    }
})();

// Mobile layout reordering for home page
function reorderMobileLayout() {
    if (window.innerWidth <= 768) {
        const heroPanel = document.querySelector('.hero-panel:not(.mobile-moved)');
        const processSection = document.querySelector('.process-section');
        const alreadyMoved = document.querySelector('.hero-panel.mobile-moved');
        
        if (heroPanel && processSection && !alreadyMoved) {
            const clonedPanel = heroPanel.cloneNode(true);
            clonedPanel.classList.add('mobile-moved');
            processSection.parentNode.insertBefore(clonedPanel, processSection.nextSibling);
        }
    } else {
        const movedPanels = document.querySelectorAll('.hero-panel.mobile-moved');
        movedPanels.forEach(function(p) { p.remove(); });
    }

    // On mobile: put Teams We Have Supported (clients) under Request a Quote (booking) via DOM order (no body flex, so process animation is unchanged)
    const clientsSection = document.getElementById('clients');
    const bookingSection = document.getElementById('booking');
    if (!clientsSection || !bookingSection) return;

    if (window.innerWidth <= 768) {
        if (bookingSection.nextSibling !== clientsSection) {
            bookingSection.parentNode.insertBefore(clientsSection, bookingSection.nextSibling);
        }
    } else {
        if (bookingSection.previousSibling !== clientsSection) {
            bookingSection.parentNode.insertBefore(clientsSection, bookingSection);
        }
    }
}

// Initialize both animations when page loads
document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
    handleProcessAnimation();
    handleServicesAnimation();
    reorderMobileLayout();
    window.addEventListener('resize', reorderMobileLayout);
}); 