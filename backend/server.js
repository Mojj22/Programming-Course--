const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Database setup
const db = new sqlite3.Database('./database.sqlite');

// Initialize database tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        country TEXT,
        experience TEXT,
        password TEXT NOT NULL,
        newsletter BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // User sessions table
    db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Course progress table
    db.run(`CREATE TABLE IF NOT EXISTS course_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        course_name TEXT NOT NULL,
        lesson_number INTEGER NOT NULL,
        completed BOOLEAN DEFAULT 0,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Contact messages table
    db.run(`CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        newsletter BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Email configuration
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: 'mmhnoopm@gmail.com',
        pass: 'your-app-password' // You need to generate an app password
    }
});

// JWT Secret
const JWT_SECRET = 'your-secret-key-change-in-production';

// Helper function to send emails
async function sendEmail(to, subject, html) {
    try {
        const mailOptions = {
            from: 'mmhnoopm@gmail.com',
            to: to,
            subject: subject,
            html: html
        };
        
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

// Auth middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}

// Routes

// Register user
app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, country, experience, password, newsletter } = req.body;

        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (user) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            db.run(
                'INSERT INTO users (firstName, lastName, email, phone, country, experience, password, newsletter) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [firstName, lastName, email, phone, country, experience, hashedPassword, newsletter ? 1 : 0],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to create user' });
                    }

                    // Send welcome email
                    const welcomeEmailHtml = `
                        <h2>مرحباً ${firstName}!</h2>
                        <p>شكراً لانضمامك إلى دورة البرمجة!</p>
                        <p>تم إنشاء حسابك بنجاح. يمكنك الآن الوصول إلى جميع الكورسات والموارد.</p>
                        <p>مع تحيات فريق دورة البرمجة</p>
                    `;

                    sendEmail(email, 'مرحباً بك في دورة البرمجة!', welcomeEmailHtml);

                    // Send notification to admin
                    const adminNotificationHtml = `
                        <h2>مستخدم جديد انضم إلى الموقع</h2>
                        <p><strong>الاسم:</strong> ${firstName} ${lastName}</p>
                        <p><strong>البريد الإلكتروني:</strong> ${email}</p>
                        <p><strong>الهاتف:</strong> ${phone || 'غير محدد'}</p>
                        <p><strong>البلد:</strong> ${country || 'غير محدد'}</p>
                        <p><strong>مستوى الخبرة:</strong> ${experience || 'غير محدد'}</p>
                        <p><strong>الاشتراك في النشرة:</strong> ${newsletter ? 'نعم' : 'لا'}</p>
                    `;

                    sendEmail('mmhnoopm@gmail.com', 'مستخدم جديد - دورة البرمجة', adminNotificationHtml);

                    res.json({ 
                        success: true, 
                        message: 'User created successfully',
                        userId: this.lastID 
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Store session
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            db.run(
                'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user.id, token, expiresAt.toISOString()]
            );

            // Send login notification to admin
            const loginNotificationHtml = `
                <h2>تسجيل دخول جديد</h2>
                <p><strong>المستخدم:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>البريد الإلكتروني:</strong> ${user.email}</p>
                <p><strong>وقت تسجيل الدخول:</strong> ${new Date().toLocaleString('ar-SA')}</p>
            `;

            sendEmail('mmhnoopm@gmail.com', 'تسجيل دخول - دورة البرمجة', loginNotificationHtml);

            res.json({
                success: true,
                token: token,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    experience: user.experience
                }
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Social login (Google/Facebook)
app.post('/api/social-login', async (req, res) => {
    try {
        const { email, firstName, lastName, method } = req.body;

        // Check if user exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                // Create new user for social login
                const hashedPassword = await bcrypt.hash('social-login', 10);
                
                db.run(
                    'INSERT INTO users (firstName, lastName, email, password, experience) VALUES (?, ?, ?, ?, ?)',
                    [firstName, lastName, email, hashedPassword, 'beginner'],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to create user' });
                        }

                        // Generate token for new user
                        const token = jwt.sign(
                            { userId: this.lastID, email: email },
                            JWT_SECRET,
                            { expiresIn: '7d' }
                        );

                        // Send registration notification
                        const registrationHtml = `
                            <h2>تسجيل جديد عبر ${method}</h2>
                            <p><strong>الاسم:</strong> ${firstName} ${lastName}</p>
                            <p><strong>البريد الإلكتروني:</strong> ${email}</p>
                            <p><strong>طريقة التسجيل:</strong> ${method}</p>
                        `;

                        sendEmail('mmhnoopm@gmail.com', `تسجيل جديد عبر ${method}`, registrationHtml);

                        res.json({
                            success: true,
                            token: token,
                            user: {
                                id: this.lastID,
                                firstName: firstName,
                                lastName: lastName,
                                email: email,
                                experience: 'beginner'
                            }
                        });
                    }
                );
            } else {
                // User exists, generate token
                const token = jwt.sign(
                    { userId: user.id, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );

                // Send login notification
                const loginHtml = `
                    <h2>تسجيل دخول عبر ${method}</h2>
                    <p><strong>المستخدم:</strong> ${user.firstName} ${user.lastName}</p>
                    <p><strong>البريد الإلكتروني:</strong> ${user.email}</p>
                    <p><strong>طريقة تسجيل الدخول:</strong> ${method}</p>
                `;

                sendEmail('mmhnoopm@gmail.com', `تسجيل دخول عبر ${method}`, loginHtml);

                res.json({
                    success: true,
                    token: token,
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        experience: user.experience
                    }
                });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Forgot password
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(400).json({ error: 'Email not found' });
            }

            // Generate reset token
            const resetToken = jwt.sign(
                { userId: user.id, email: email },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Send reset email
            const resetEmailHtml = `
                <h2>إعادة تعيين كلمة المرور</h2>
                <p>مرحباً ${user.firstName},</p>
                <p>تم طلب إعادة تعيين كلمة المرور لحسابك في دورة البرمجة.</p>
                <p>إذا كنت لم تطلب هذا، يرجى تجاهل هذا البريد.</p>
                <p>مع تحيات فريق دورة البرمجة</p>
            `;

            sendEmail(email, 'إعادة تعيين كلمة المرور', resetEmailHtml);

            // Send notification to admin
            const adminNotificationHtml = `
                <h2>طلب إعادة تعيين كلمة المرور</h2>
                <p><strong>المستخدم:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>البريد الإلكتروني:</strong> ${user.email}</p>
                <p><strong>وقت الطلب:</strong> ${new Date().toLocaleString('ar-SA')}</p>
            `;

            sendEmail('mmhnoopm@gmail.com', 'طلب إعادة تعيين كلمة المرور', adminNotificationHtml);

            res.json({ success: true, message: 'Reset email sent' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Contact form
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, subject, message, newsletter } = req.body;

        // Save contact message to database
        db.run(
            'INSERT INTO contact_messages (firstName, lastName, email, phone, subject, message, newsletter) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [firstName, lastName, email, phone, subject, message, newsletter ? 1 : 0],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save message' });
                }

                // Send notification to admin
                const contactHtml = `
                    <h2>رسالة جديدة من نموذج الاتصال</h2>
                    <p><strong>الاسم:</strong> ${firstName} ${lastName}</p>
                    <p><strong>البريد الإلكتروني:</strong> ${email}</p>
                    <p><strong>الهاتف:</strong> ${phone || 'غير محدد'}</p>
                    <p><strong>الموضوع:</strong> ${subject}</p>
                    <p><strong>الرسالة:</strong></p>
                    <p>${message}</p>
                    <p><strong>الاشتراك في النشرة:</strong> ${newsletter ? 'نعم' : 'لا'}</p>
                `;

                sendEmail('mmhnoopm@gmail.com', 'رسالة جديدة - نموذج الاتصال', contactHtml);

                res.json({ success: true, message: 'Message sent successfully' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Save course progress
app.post('/api/course-progress', authenticateToken, (req, res) => {
    try {
        const { courseName, lessonNumber } = req.body;
        const userId = req.user.userId;

        db.run(
            'INSERT OR REPLACE INTO course_progress (user_id, course_name, lesson_number, completed, completed_at) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
            [userId, courseName, lessonNumber],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save progress' });
                }

                res.json({ success: true, message: 'Progress saved' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get course progress
app.get('/api/course-progress/:courseName', authenticateToken, (req, res) => {
    try {
        const { courseName } = req.params;
        const userId = req.user.userId;

        db.all(
            'SELECT * FROM course_progress WHERE user_id = ? AND course_name = ?',
            [userId, courseName],
            (err, rows) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json({ success: true, progress: rows });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;

        db.get(
            'SELECT id, firstName, lastName, email, phone, country, experience, newsletter, createdAt FROM users WHERE id = ?',
            [userId],
            (err, user) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                res.json({ success: true, user: user });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});
