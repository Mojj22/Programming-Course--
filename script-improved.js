// Enhanced Website Manager with Better Effects
class ImprovedWebsiteManager {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'ar';
        this.isDark = localStorage.getItem('theme') === 'dark';
        this.currentUser = null;
        this.isLoggedIn = false;
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.init();
    }

    init() {
        this.setupLanguageToggle();
        this.setupThemeToggle();
        this.applyLanguage();
        this.applyTheme();
        this.setupAnimations();
        this.setupFormHandling();
        this.generateSubtleBackground();
        this.addNavigationArrows();
        this.checkUserAuthentication();
        this.showWelcomeMessage();
        this.setupScrollEffects();
    }

    // Language Management
    setupLanguageToggle() {
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'ar' ? 'en' : 'ar';
        localStorage.setItem('language', this.currentLang);
        this.applyLanguage();
    }

    applyLanguage() {
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.textContent = this.currentLang === 'ar' ? 'EN' : 'AR';
        }

        document.documentElement.lang = this.currentLang;
        document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
        document.body.setAttribute('lang', this.currentLang);

        const elements = document.querySelectorAll('[data-ar][data-en]');
        elements.forEach(element => {
            const text = this.currentLang === 'ar' ? 
                element.getAttribute('data-ar') : 
                element.getAttribute('data-en');
            if (text) element.textContent = text;
        });
    }

    // Theme Management
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        this.isDark = !this.isDark;
        localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
        this.applyTheme();
    }

    applyTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = this.isDark ? '☀️' : '🌙';
        }

        if (this.isDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    // Subtle Animations and Effects
    setupAnimations() {
        this.addSubtleEffects();
        this.setupHoverEffects();
        this.setupIntersectionObserver();
    }

    addSubtleEffects() {
        // Add subtle effects to cards
        const cards = document.querySelectorAll('.course-card, .feature-card, .contact-card');
        cards.forEach((card, index) => {
            card.classList.add('card-3d');
            
            // Staggered animation
            card.style.animationDelay = `${index * 0.1}s`;
            card.style.animation = 'fadeInUp 0.6s ease-out forwards';
            
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px)';
                card.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '';
            });
        });

        // Add subtle effects to buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-2px)';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
            });
        });
    }

    setupHoverEffects() {
        // Enhanced hover effects for navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                link.style.color = '#3b82f6';
            });
            
            link.addEventListener('mouseleave', () => {
                if (!link.classList.contains('active')) {
                    link.style.color = '';
                }
            });
        });
    }

    setupScrollEffects() {
        // Smooth scroll behavior
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Subtle parallax effect
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.hero, .features, .about');
            
            parallaxElements.forEach(element => {
                const speed = 0.3;
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe all sections
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(section);
        });
    }

    // Subtle Background Effects
    generateSubtleBackground() {
        // Remove existing background if any
        const existingBackground = document.getElementById('subtleBackground');
        if (existingBackground) {
            existingBackground.remove();
        }

        const backgroundContainer = document.createElement('div');
        backgroundContainer.id = 'subtleBackground';
        backgroundContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            overflow: hidden;
            pointer-events: none;
        `;

        document.body.appendChild(backgroundContainer);

        // Create subtle floating particles
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: rgba(59, 130, 246, 0.2);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                animation: floatParticle ${Math.random() * 10 + 10}s linear infinite;
                animation-delay: ${Math.random() * 10}s;
            `;
            backgroundContainer.appendChild(particle);
        }

        // Add CSS animation if not exists
        if (!document.getElementById('particleAnimation')) {
            const style = document.createElement('style');
            style.id = 'particleAnimation';
            style.textContent = `
                @keyframes floatParticle {
                    0% {
                        transform: translateY(100vh) translateX(0px);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.3;
                    }
                    90% {
                        opacity: 0.3;
                    }
                    100% {
                        transform: translateY(-100vh) translateX(${Math.random() * 100}px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Navigation Arrows
    addNavigationArrows() {
        const currentPage = window.location.pathname.split('/').pop();
        
        // Add left arrow (back to previous page)
        if (currentPage !== 'index.html' && currentPage !== '') {
            const leftArrow = document.createElement('a');
            leftArrow.className = 'nav-arrow left';
            leftArrow.href = this.getPreviousPage(currentPage);
            leftArrow.innerHTML = '←';
            leftArrow.title = this.currentLang === 'ar' ? 'العودة للصفحة السابقة' : 'Back to Previous Page';
            document.body.appendChild(leftArrow);
        }

        // Add right arrow (forward to next page)
        const rightArrow = document.createElement('a');
        rightArrow.className = 'nav-arrow right';
        rightArrow.href = this.getNextPage(currentPage);
        rightArrow.innerHTML = '→';
        rightArrow.title = this.currentLang === 'ar' ? 'الانتقال للصفحة التالية' : 'Go to Next Page';
        document.body.appendChild(rightArrow);
    }

    getPreviousPage(currentPage) {
        const pages = ['', 'index.html', 'about.html', 'courses.html', 'contact.html'];
        const currentIndex = pages.indexOf(currentPage);
        return currentIndex > 0 ? pages[currentIndex - 1] || 'index.html' : 'index.html';
    }

    getNextPage(currentPage) {
        const pages = ['', 'index.html', 'about.html', 'courses.html', 'contact.html'];
        const currentIndex = pages.indexOf(currentPage);
        return pages[currentIndex + 1] || 'contact.html';
    }

    // Welcome Message
    showWelcomeMessage() {
        // Only show welcome message if user is logged in
        if (this.isLoggedIn && this.currentUser) {
            const welcomeMessage = document.createElement('div');
            welcomeMessage.className = 'welcome-message';
            welcomeMessage.innerHTML = `
                <h2>${this.currentLang === 'ar' ? 'مرحباً' : 'Welcome'}, ${this.currentUser.firstName}!</h2>
                <p>${this.currentLang === 'ar' ? 'مرحباً بك في دورة البرمجة' : 'Welcome to Programming Course'}</p>
            `;
            
            document.body.appendChild(welcomeMessage);
            
            // Remove after 5 seconds
            setTimeout(() => {
                welcomeMessage.style.opacity = '0';
                welcomeMessage.style.transform = 'translate(-50%, -50%) scale(0.8)';
                setTimeout(() => {
                    if (welcomeMessage.parentNode) {
                        welcomeMessage.parentNode.removeChild(welcomeMessage);
                    }
                }, 500);
            }, 5000);
        }
    }

    // User Authentication
    async checkUserAuthentication() {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.user;
                    this.isLoggedIn = true;
                    this.updateNavigationForLoggedInUser();
                } else {
                    localStorage.removeItem('authToken');
                }
            } catch (error) {
                console.error('Authentication check failed:', error);
                localStorage.removeItem('authToken');
            }
        }
    }

    updateNavigationForLoggedInUser() {
        const navControls = document.querySelector('.nav-controls');
        if (navControls && this.isLoggedIn) {
            navControls.innerHTML = `
                <span class="user-greeting" style="color: var(--main-color); font-weight: 500;">
                    ${this.currentLang === 'ar' ? 'مرحباً' : 'Hello'}, ${this.currentUser.firstName}
                </span>
                <button class="btn btn-secondary" onclick="websiteManager.logout()">
                    ${this.currentLang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                </button>
                <button class="lang-toggle" id="langToggle">${this.currentLang === 'ar' ? 'EN' : 'AR'}</button>
                <button class="theme-toggle" id="themeToggle">${this.isDark ? '☀️' : '🌙'}</button>
            `;
            
            // Re-setup toggles
            this.setupLanguageToggle();
            this.setupThemeToggle();
        }
    }

    async logout() {
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                await fetch(`${this.apiBaseUrl}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            localStorage.removeItem('authToken');
            this.currentUser = null;
            this.isLoggedIn = false;
            location.reload();
        }
    }

    // Form Handling
    setupFormHandling() {
        // Contact form
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactForm(contactForm);
            });
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLoginForm(loginForm);
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegisterForm(registerForm);
            });
        }
    }

    async handleContactForm(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.innerHTML = '<span class="loading"></span> جاري الإرسال...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);
            const contactData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                subject: formData.get('subject'),
                message: formData.get('message'),
                newsletter: formData.get('newsletter') === 'on'
            };

            const response = await fetch(`${this.apiBaseUrl}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            if (response.ok) {
                this.showNotification(
                    this.currentLang === 'ar' ? 'تم إرسال الرسالة بنجاح!' : 'Message sent successfully!',
                    'success'
                );
                form.reset();
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            this.showNotification(
                this.currentLang === 'ar' ? 'خطأ في إرسال الرسالة' : 'Failed to send message',
                'error'
            );
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleLoginForm(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.innerHTML = '<span class="loading"></span> جاري تسجيل الدخول...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            const response = await fetch(`${this.apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                this.currentUser = data.user;
                this.isLoggedIn = true;
                
                this.showNotification(
                    this.currentLang === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Login successful!',
                    'success'
                );
                
                setTimeout(() => {
                    window.location.href = 'courses.html';
                }, 1500);
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            this.showNotification(
                this.currentLang === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login failed',
                'error'
            );
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegisterForm(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.innerHTML = '<span class="loading"></span> جاري إنشاء الحساب...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);
            const registerData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                country: formData.get('country'),
                experience: formData.get('experience'),
                password: formData.get('password'),
                newsletter: formData.get('newsletter') === 'on'
            };

            // Validate password confirmation
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            
            if (password !== confirmPassword) {
                throw new Error(this.currentLang === 'ar' ? 'كلمة المرور غير متطابقة' : 'Passwords do not match');
            }

            const response = await fetch(`${this.apiBaseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification(
                    this.currentLang === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!',
                    'success'
                );
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                throw new Error(data.error || 'Registration failed');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // Notification System
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'success' ? '#10b981' : 
                           type === 'error' ? '#ef4444' : '#3b82f6',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the improved website manager
const websiteManager = new ImprovedWebsiteManager();

// Course Progress Tracking
class CourseProgressManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.init();
    }

    init() {
        this.setupCourseProgressTracking();
    }

    setupCourseProgressTracking() {
        const markCompleteButtons = document.querySelectorAll('.mark-complete');
        markCompleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.markLessonComplete(e.target);
            });
        });
    }

    async markLessonComplete(button) {
        const lessonCard = button.closest('.lesson-card');
        const courseName = this.getCurrentCourseName();
        const lessonNumber = lessonCard.getAttribute('data-lesson');

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                websiteManager.showNotification(
                    websiteManager.currentLang === 'ar' ? 
                    'يجب تسجيل الدخول أولاً' : 
                    'Please login first', 'error'
                );
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/course-progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    courseName: courseName,
                    lessonNumber: parseInt(lessonNumber)
                })
            });

            if (response.ok) {
                button.textContent = websiteManager.currentLang === 'ar' ? 'مكتمل ✓' : 'Completed ✓';
                button.style.background = '#10b981';
                button.disabled = true;
                
                this.updateProgressBar();
            } else {
                throw new Error('Failed to save progress');
            }
        } catch (error) {
            console.error('Error marking lesson complete:', error);
        }
    }

    getCurrentCourseName() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('-course.html', '').replace('courses/', '');
    }

    updateProgressBar() {
        const completedLessons = document.querySelectorAll('.mark-complete[disabled]');
        const totalLessons = document.querySelectorAll('.mark-complete').length;
        const progress = (completedLessons.length / totalLessons) * 100;
        
        const progressBar = document.getElementById('courseProgress');
        const progressText = document.getElementById('progressText');
        
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
        
        if (progressText) {
            progressText.textContent = websiteManager.currentLang === 'ar' ? 
                `التقدم: ${Math.round(progress)}%` : 
                `Progress: ${Math.round(progress)}%`;
        }
    }
}

// Initialize course progress manager if on course page
if (window.location.pathname.includes('course.html')) {
    const courseProgressManager = new CourseProgressManager();
}

// Export for global access
window.websiteManager = websiteManager;
