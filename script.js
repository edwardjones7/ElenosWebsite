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
}); 