// نظام تسجيل الدخول
class LoginSystem {
    constructor() {
        this.init();
    }

    init() {
        this.initTheme();
        this.initEventListeners();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            localStorage.setItem('theme', newTheme);
        });
    }

    initEventListeners() {
        // نموذج تسجيل الدخول
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // إظهار/إخفاء كلمة المرور
        document.getElementById('toggleLoginPassword').addEventListener('click', (e) => {
            this.togglePasswordVisibility('loginPassword', e.target);
        });

        // المصادقة الاجتماعية
        document.getElementById('googleLoginBtn').addEventListener('click', () => this.socialLogin('google'));
        document.getElementById('facebookLoginBtn').addEventListener('click', () => this.socialLogin('facebook'));
    }

    handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        let isValid = true;

        // التحقق من البريد الإلكتروني
        if (!email) {
            this.showError('emailError', 'البريد الإلكتروني مطلوب');
            isValid = false;
        } else {
            this.hideError('emailError');
        }

        // التحقق من كلمة المرور
        if (!password) {
            this.showError('passwordError', 'كلمة المرور مطلوبة');
            isValid = false;
        } else {
            this.hideError('passwordError');
        }

        if (!isValid) return;

        // محاكاة التحقق من بيانات المستخدم
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // حفظ حالة تسجيل الدخول
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`
            }));

            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }

            this.showSuccess('تم تسجيل الدخول بنجاح!');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            this.showError('passwordError', 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }
    }

    socialLogin(provider) {
        // محاكاة المصادقة الاجتماعية
        const socialUsers = {
            google: {
                id: 'google_' + Date.now(),
                name: 'مستخدم Google',
                email: `user${Date.now()}@gmail.com`,
                provider: 'google'
            },
            facebook: {
                id: 'facebook_' + Date.now(),
                name: 'مستخدم Facebook',
                email: `user${Date.now()}@facebook.com`,
                provider: 'facebook'
            }
        };

        const user = socialUsers[provider];
        
        // حفظ بيانات المستخدم
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // إظهار رسالة نجاح
        this.showSuccess(`تم تسجيل الدخول بنجاح باستخدام ${provider === 'google' ? 'Google' : 'Facebook'}`);
        
        // التوجيه إلى لوحة التحكم
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }

    togglePasswordVisibility(fieldId, button) {
        const field = document.getElementById(fieldId);
        const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
        field.setAttribute('type', type);
        button.textContent = type === 'password' ? '👁️' : '🔒';
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.classList.add('show');
    }

    hideError(elementId) {
        const element = document.getElementById(elementId);
        element.classList.remove('show');
    }

    showSuccess(message) {
        alert(message); // يمكن استبدال هذا بنظام إشعارات أفضل
    }
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new LoginSystem();
});