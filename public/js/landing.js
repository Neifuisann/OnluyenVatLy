document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle functionality (copied from lessons page)
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');
    
    if (mobileToggle && navLinks) {
        console.log('DEBUG: Mobile menu toggle elements found, adding event listener');
        
        mobileToggle.addEventListener('click', function() {
            console.log('DEBUG: Mobile menu toggle clicked');
            navLinks.classList.toggle('active');
            
            // Toggle hamburger icon
            const icon = mobileToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });
        
        // Close mobile menu when clicking on nav links
        const navLinkElements = navLinks.querySelectorAll('.nav-link');
        navLinkElements.forEach(link => {
            link.addEventListener('click', () => {
                console.log('DEBUG: Nav link clicked, closing mobile menu');
                navLinks.classList.remove('active');
                mobileToggle.querySelector('i').className = 'fas fa-bars';
            });
        });
    } else {
        console.error('DEBUG: Mobile menu toggle elements not found');
    }

    // Get the modal
    const modal = document.getElementById('user-info-modal');
    const userInfoForm = document.getElementById('user-info-form');

    // Get the "Chinh phục" button (updated selector for new nav structure)
    const conquestButton = document.querySelector('.main-nav a[href="/quizgame"]');
    if (conquestButton) {
        conquestButton.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    }

    // Function to open modal
    function openModal() {
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    // Function to close modal
    window.closeModal = function() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Handle form submission
    userInfoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const studentName = document.getElementById('student-name').value;
        const studentDob = document.getElementById('student-dob').value;
        const studentId = document.getElementById('student-id').value;

        // Create student info object
        const studentInfo = {
            name: studentName,
            dob: studentDob,
            id: studentId,
            studentId: studentId // Adding this for consistency with other parts of the app
        };

        // Store in both localStorage and sessionStorage
        localStorage.setItem('studentInfo', JSON.stringify(studentInfo));
        sessionStorage.setItem('studentInfo', JSON.stringify(studentInfo));

        // Redirect to the quizgame page
        window.location.href = '/quizgame';
    });
}); 