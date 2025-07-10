// Shared mobile navigation functionality
console.log('nav-mobile.js loaded at:', new Date().toISOString());

// Function to initialize mobile navigation
function initializeMobileNav() {
    console.log('Initializing mobile navigation...');
    
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    console.log('Mobile toggle element:', mobileToggle);
    console.log('Nav links element:', navLinks);
    console.log('Window width:', window.innerWidth);
    console.log('Screen orientation:', window.orientation);
    
    if (!mobileToggle) {
        console.error('Mobile toggle button not found!');
        return;
    }
    
    if (!navLinks) {
        console.error('Nav links container not found!');
        return;
    }
    
    // Remove any existing event listeners first
    const newToggle = mobileToggle.cloneNode(true);
    mobileToggle.parentNode.replaceChild(newToggle, mobileToggle);
    
    // Toggle mobile menu
    newToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Toggle clicked!');
        console.log('Nav links classes before:', navLinks.classList.toString());
        
        navLinks.classList.toggle('active');
        
        console.log('Nav links classes after:', navLinks.classList.toString());
        console.log('Computed display:', window.getComputedStyle(navLinks).display);
        console.log('Computed transform:', window.getComputedStyle(navLinks).transform);
        console.log('Computed opacity:', window.getComputedStyle(navLinks).opacity);
        
        // Toggle hamburger icon
        const icon = newToggle.querySelector('i');
        if (icon) {
            if (navLinks.classList.contains('active')) {
                icon.className = 'fas fa-times';
                console.log('Changed icon to X');
            } else {
                icon.className = 'fas fa-bars';
                console.log('Changed icon to bars');
            }
        }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.main-nav')) {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const icon = newToggle.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-bars';
                }
                console.log('Closed menu - clicked outside');
            }
        }
    });
    
    // Close menu when clicking on nav links
    const navLinkElements = navLinks.querySelectorAll('.nav-link');
    navLinkElements.forEach(link => {
        link.addEventListener('click', function() {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const icon = newToggle.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-bars';
                }
                console.log('Closed menu - clicked nav link');
            }
        });
    });
    
    console.log('Mobile navigation initialized successfully');
}

// Try multiple initialization strategies
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMobileNav);
} else {
    // DOM is already loaded
    initializeMobileNav();
}

// Also try on window load as fallback
window.addEventListener('load', function() {
    console.log('Window loaded - checking mobile nav...');
    if (!document.querySelector('.nav-links.active')) {
        initializeMobileNav();
    }
});

// Handle orientation changes
window.addEventListener('orientationchange', function() {
    console.log('Orientation changed to:', window.orientation);
    setTimeout(initializeMobileNav, 100);
});