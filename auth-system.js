// نظام المصادقة المتكامل مع إرسال البريد الإلكتروني الحقيقي
class AuthSystem {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.verificationCode = '';
        this.userData = {};
        this.resendTimer = null;
        this.redirectTimer = null;
        
        this.init();
    }

    init() {
        this.initTheme();
        this.initEventListeners();
        this.initPasswordStrength();
        this.initCodeInputs();
        
        // تهيئة EmailJS
        this.initEmailJS();
    }

    initEmailJS() {
        // تهيئة EmailJS بمفاتيحك الخاصة
        if (typeof emailjs !== 'undefined') {
            emailjs.init("4b0-6VKqIZ507521e"); // استبدل بـ Public Key الخاص بك
            console.log("EmailJS initialized successfully");
        } else {
            console.log("EmailJS not loaded - check script tag");
        }
    }

    // ... باقي الدوال تبقى كما هي

    async sendVerificationCode() {
        try {
            // إظهار حالة التحميل
            const nextBtn = document.getElementById('nextToVerificationBtn');
            const originalText = nextBtn.innerHTML;
            nextBtn.innerHTML = '<span>جاري إرسال الرمز...</span>';
            nextBtn.disabled = true;

            // إنشاء رمز التحقق
            this.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            console.log("Generated code:", this.verificationCode);
            
            // محاولة إرسال البريد الإلكتروني
            const emailSent = await this.sendEmailVerification();
            
            if (emailSent) {
                alert("تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح!");
                this.goToStep(3);
                this.startResendTimer();
            } else {
                // إذا فشل الإرسال، اعرض الرمز للمستخدم
                alert(`تم إنشاء الرمز: ${this.verificationCode}\n\n(لأغراض الاختبار - في النسخة النهائية سيتم الإرسال إلى البريد)`);
                this.goToStep(3);
                this.startResendTimer();
            }
            
        } catch (error) {
            console.error('Error sending verification code:', error);
            // في حالة الخطأ، اعرض الرمز للمستخدم
            alert(`رمز التحقق: ${this.verificationCode}\n\nاستخدم هذا الرمز للمتابعة`);
            this.goToStep(3);
            this.startResendTimer();
        } finally {
            // إعادة تعيين الزر
            const nextBtn = document.getElementById('nextToVerificationBtn');
            nextBtn.innerHTML = originalText;
            nextBtn.disabled = false;
        }
    }

    async sendEmailVerification() {
        // حاول استخدام EmailJS أولاً
        if (typeof emailjs !== 'undefined') {
            try {
                const templateParams = {
                    to_email: this.userData.email,
                    from_name: 'دورة البرمجة',
                    to_name: `${this.userData.firstName} ${this.userData.lastName}`,
                    verification_code: this.verificationCode,
                    website_name: 'Programming Course'
                };

                const response = await emailjs.send(
                    'service_v6fmvif', // استبدل بـ Service ID الخاص بك
                    'template_dxmr34v', // استبدل بـ Template ID الخاص بك
                    templateParams
                );
                
                console.log('EmailJS sent successfully:', response);
                return true;
                
            } catch (error) {
                console.error('EmailJS failed:', error);
                // انتقل إلى الطريقة البديلة
            }
        }

        // الطريقة البديلة: استخدام FormSubmit
        try {
            const response = await fetch('https://formsubmit.co/ajax/mmhnoopm@gmail.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: `${this.userData.firstName} ${this.userData.lastName}`,
                    email: this.userData.email,
                    subject: 'رمز التحقق - دورة البرمجة',
                    message: `رمز التحقق الخاص بك هو: ${this.verificationCode}`,
                    _subject: 'رمز التحقق - دورة البرمجة',
                    _captcha: 'false'
                })
            });

            const result = await response.json();
            console.log('FormSubmit response:', result);
            return result.success;
            
        } catch (error) {
            console.error('FormSubmit failed:', error);
            return false;
        }
    }

    // ... باقي الدوال كما هي
}

// تهيئة النظام
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
});