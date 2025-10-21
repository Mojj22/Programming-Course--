// Secure Authentication System
class SecureAuthManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        this.setupAuthForms();
        this.checkAuthenticationStatus();
        this.setupLanguageToggle();
        this.setupThemeToggle();
    }

    // Form Validation
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password && password.length >= 8;
    }

    validateRequired(fields) {
        for (const field of fields) {
            if (!field.value.trim()) {
                return { valid: false, field: field, message: 'This field is required' };
            }
        }
        return { valid: true };
    }

    showError(field, message) {
        // Remove existing error
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        `;
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);

        // Add error styling to field
        field.style.borderColor = '#ef4444';
        field.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
    }

    clearError(field) {
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
        field.style.borderColor = '';
        field.style.boxShadow = '';
    }

    // Login Form Handling
    setupAuthForms() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(loginForm);
            });
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(registerForm);
            });
        }

        // Real-time validation
        this.setupRealTimeValidation();
    }

    setupRealTimeValidation() {
        // Email validation
        const emailFields = document.querySelectorAll('input[type="email"]');
        emailFields.forEach(field => {
            field.addEventListener('blur', () => {
                if (field.value && !this.validateEmail(field.value)) {
                    this.showError(field, 'Please enter a valid email address');
                } else {
                    this.clearError(field);
                }
            });
        });

        // Password validation
        const passwordFields = document.querySelectorAll('input[type="password"]');
        passwordFields.forEach(field => {
            field.addEventListener('blur', () => {
                if (field.value && !this.validatePassword(field.value)) {
                    this.showError(field, 'Password must be at least 8 characters long');
                } else {
                    this.clearError(field);
                }
            });
        });

        // Required field validation
        const requiredFields = document.querySelectorAll('input[required], select[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => {
                if (!field.value.trim()) {
                    this.showError(field, 'This field is required');
                } else {
                    this.clearError(field);
                }
            });
        });
    }

    async handleLogin(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Clear previous errors
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());

        // Get form data
        const email = form.querySelector('#email').value.trim();
        const password = form.querySelector('#password').value.trim();

        // Validate required fields
        const validation = this.validateRequired([
            form.querySelector('#email'),
            form.querySelector('#password')
        ]);

        if (!validation.valid) {
            this.showError(validation.field, validation.message);
            return;
        }

        // Validate email format
        if (!this.validateEmail(email)) {
            this.showError(form.querySelector('#email'), 'Please enter a valid email address');
            return;
        }

        // Validate password
        if (!this.validatePassword(password)) {
            this.showError(form.querySelector('#password'), 'Password must be at least 8 characters long');
            return;
        }

        // Show loading state
        submitBtn.innerHTML = '<span class="loading"></span> جاري تسجيل الدخول...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${this.apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store authentication token
                localStorage.setItem('authToken', data.token);
                this.currentUser = data.user;
                this.isLoggedIn = true;

                this.showNotification('تم تسجيل الدخول بنجاح!', 'success');
                
                // Redirect to profile page
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Clear previous errors
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());

        // Get form data
        const formData = new FormData(form);
        const registerData = {
            firstName: formData.get('firstName').trim(),
            lastName: formData.get('lastName').trim(),
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim(),
            country: formData.get('country'),
            experience: formData.get('experience'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        // Validate required fields
        const requiredFields = [
            form.querySelector('#firstName'),
            form.querySelector('#lastName'),
            form.querySelector('#email'),
            form.querySelector('#country'),
            form.querySelector('#experience'),
            form.querySelector('#password'),
            form.querySelector('#confirmPassword')
        ];

        const validation = this.validateRequired(requiredFields);
        if (!validation.valid) {
            this.showError(validation.field, validation.message);
            return;
        }

        // Validate email format
        if (!this.validateEmail(registerData.email)) {
            this.showError(form.querySelector('#email'), 'Please enter a valid email address');
            return;
        }

        // Validate password
        if (!this.validatePassword(registerData.password)) {
            this.showError(form.querySelector('#password'), 'Password must be at least 8 characters long');
            return;
        }

        // Validate password confirmation
        if (registerData.password !== registerData.confirmPassword) {
            this.showError(form.querySelector('#confirmPassword'), 'Passwords do not match');
            return;
        }

        // Show loading state
        submitBtn.innerHTML = '<span class="loading"></span> جاري إنشاء الحساب...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${this.apiBaseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName: registerData.firstName,
                    lastName: registerData.lastName,
                    email: registerData.email,
                    phone: registerData.phone,
                    country: registerData.country,
                    experience: registerData.experience,
                    password: registerData.password,
                    newsletter: formData.get('newsletter') === 'on'
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('تم إنشاء الحساب بنجاح!', 'success');
                
                // Clear form
                form.reset();
                
                // Redirect to login page
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                throw new Error(data.error || 'Registration failed');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async checkAuthenticationStatus() {
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
                    مرحباً, ${this.currentUser.firstName}
                </span>
                <a href="profile.html" class="btn btn-secondary">الملف الشخصي</a>
                <button class="btn btn-secondary" onclick="authManager.logout()">تسجيل الخروج</button>
                <button class="lang-toggle" id="langToggle">${document.body.getAttribute('lang') === 'ar' ? 'EN' : 'AR'}</button>
                <button class="theme-toggle" id="themeToggle">🌙</button>
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
                           type === 'error' ? '#ef4444' : '#3b82f6'
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

    // Language and Theme Toggles
    setupLanguageToggle() {
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                const currentLang = document.body.getAttribute('lang') || 'ar';
                const newLang = currentLang === 'ar' ? 'en' : 'ar';
                
                document.body.setAttribute('lang', newLang);
                document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
                
                // Update all elements with data attributes
                document.querySelectorAll('[data-ar]').forEach(element => {
                    const text = newLang === 'ar' ? 
                        element.getAttribute('data-ar') : 
                        element.getAttribute('data-en');
                    if (text) element.textContent = text;
                });
                
                langToggle.textContent = newLang === 'ar' ? 'EN' : 'AR';
                localStorage.setItem('language', newLang);
            });
        }
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const isDark = document.body.classList.contains('dark-theme');
                if (isDark) {
                    document.body.classList.remove('dark-theme');
                    themeToggle.textContent = '🌙';
                } else {
                    document.body.classList.add('dark-theme');
                    themeToggle.textContent = '☀️';
                }
                localStorage.setItem('theme', isDark ? 'light' : 'dark');
            });
        }
    }
}

// Initialize the secure authentication manager
const authManager = new SecureAuthManager();

// Export for global access
window.authManager = authManager;
