const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your_jwt_secret_key_change_in_production';

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = 'your-google-client-id';
const FACEBOOK_APP_ID = 'your-facebook-app-id';
const FACEBOOK_APP_SECRET = 'your-facebook-app-secret';

// Initialize Google OAuth client
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

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
        password TEXT,
        newsletter BOOLEAN DEFAULT 0,
        emailVerified BOOLEAN DEFAULT 0,
        phoneVerified BOOLEAN DEFAULT 0,
        profileImage TEXT,
        googleId TEXT,
        facebookId TEXT,
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
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, course_name, lesson_number)
    )`);

    // Verification codes table
    db.run(`CREATE TABLE IF NOT EXISTS verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        phone TEXT,
        code TEXT NOT NULL,
        type TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        pass: 'your-app-password' // Replace with actual app password
    }
});

// Helper functions
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmailNotification = (to, subject, body) => {
    const mailOptions = {
        from: 'mmhnoopm@gmail.com',
        to: to,
        subject: subject,
        html: body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Email sending failed:', error);
        } else {
            console.log('Email sent successfully:', info.response);
        }
    });
};

const generateToken = (user) => {
    return jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Routes

// Send email verification code
app.post('/api/send-email-verification', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete old codes for this email
        db.run('DELETE FROM verification_codes WHERE email = ? AND type = ?', [email, 'email']);

        // Insert new code
        db.run('INSERT INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)',
            [email, code, 'email', expiresAt.toISOString()], (err) => {
                if (err) {
                    console.error('Error saving verification code:', err);
                    return res.status(500).json({ error: 'Failed to save verification code' });
                }

                // Send email
                const emailBody = `
                    <h2>رمز التحقق - دورة البرمجة</h2>
                    <p>رمز التحقق الخاص بك هو:</p>
                    <h1 style="color: #1a73e8; font-size: 32px; letter-spacing: 5px;">${code}</h1>
                    <p>هذا الرمز صالح لمدة 10 دقائق.</p>
                    <p>إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.</p>
                `;

                sendEmailNotification(email, 'رمز التحقق - دورة البرمجة', emailBody);

                res.json({ message: 'Verification code sent successfully' });
            });
    } catch (error) {
        console.error('Error sending verification code:', error);
        res.status(500).json({ error: 'Failed to send verification code' });
    }
});

// Send phone verification code
app.post('/api/send-phone-verification', async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    try {
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete old codes for this phone
        db.run('DELETE FROM verification_codes WHERE phone = ? AND type = ?', [phone, 'phone']);

        // Insert new code
        db.run('INSERT INTO verification_codes (phone, code, type, expires_at) VALUES (?, ?, ?, ?)',
            [phone, code, 'phone', expiresAt.toISOString()], (err) => {
                if (err) {
                    console.error('Error saving verification code:', err);
                    return res.status(500).json({ error: 'Failed to save verification code' });
                }

                // In a real application, you would send SMS here
                console.log(`SMS Code for ${phone}: ${code}`);

                res.json({ message: 'Verification code sent successfully' });
            });
    } catch (error) {
        console.error('Error sending verification code:', error);
        res.status(500).json({ error: 'Failed to send verification code' });
    }
});

// Verify email code
app.post('/api/verify-email-code', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ error: 'Email and code are required' });
    }

    try {
        db.get('SELECT * FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expires_at > ?',
            [email, code, 'email', new Date().toISOString()], (err, row) => {
                if (err) {
                    console.error('Error verifying code:', err);
                    return res.status(500).json({ error: 'Failed to verify code' });
                }

                if (!row) {
                    return res.status(400).json({ error: 'Invalid or expired verification code' });
                }

                // Mark code as used
                db.run('UPDATE verification_codes SET used = 1 WHERE id = ?', [row.id]);

                // Check if user exists
                db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
                    if (err) {
                        console.error('Error finding user:', err);
                        return res.status(500).json({ error: 'Database error' });
                    }

                    if (user) {
                        // User exists, mark email as verified and login
                        db.run('UPDATE users SET emailVerified = 1 WHERE id = ?', [user.id]);
                        
                        const token = generateToken(user);
                        
                        // Save session
                        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                        db.run('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
                            [user.id, token, expiresAt.toISOString()]);

                        res.json({
                            message: 'Email verified and logged in successfully',
                            token: token,
                            user: {
                                id: user.id,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                emailVerified: true
                            }
                        });
                    } else {
                        // User doesn't exist, just verify the code
                        res.json({ message: 'Email verified successfully' });
                    }
                });
            });
    } catch (error) {
        console.error('Error verifying email code:', error);
        res.status(500).json({ error: 'Failed to verify email code' });
    }
});

// Verify phone code
app.post('/api/verify-phone-code', async (req, res) => {
    const { phone, code } = req.body;

    if (!phone || !code) {
        return res.status(400).json({ error: 'Phone and code are required' });
    }

    try {
        db.get('SELECT * FROM verification_codes WHERE phone = ? AND code = ? AND type = ? AND used = 0 AND expires_at > ?',
            [phone, code, 'phone', new Date().toISOString()], (err, row) => {
                if (err) {
                    console.error('Error verifying code:', err);
                    return res.status(500).json({ error: 'Failed to verify code' });
                }

                if (!row) {
                    return res.status(400).json({ error: 'Invalid or expired verification code' });
                }

                // Mark code as used
                db.run('UPDATE verification_codes SET used = 1 WHERE id = ?', [row.id]);

                // Check if user exists
                db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, user) => {
                    if (err) {
                        console.error('Error finding user:', err);
                        return res.status(500).json({ error: 'Database error' });
                    }

                    if (user) {
                        // User exists, mark phone as verified and login
                        db.run('UPDATE users SET phoneVerified = 1 WHERE id = ?', [user.id]);
                        
                        const token = generateToken(user);
                        
                        // Save session
                        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                        db.run('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
                            [user.id, token, expiresAt.toISOString()]);

                        res.json({
                            message: 'Phone verified and logged in successfully',
                            token: token,
                            user: {
                                id: user.id,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                phoneVerified: true
                            }
                        });
                    } else {
                        // User doesn't exist, just verify the code
                        res.json({ message: 'Phone verified successfully' });
                    }
                });
            });
    } catch (error) {
        console.error('Error verifying phone code:', error);
        res.status(500).json({ error: 'Failed to verify phone code' });
    }
});

// Register user
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password, phone, country, experience, newsletter } = req.body;

    if (!firstName || !lastName || !email || !password || !country || !experience) {
        return res.status(400).json({ error: 'All required fields must be filled' });
    }

    try {
        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            db.run('INSERT INTO users (firstName, lastName, email, password, phone, country, experience, newsletter) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [firstName, lastName, email, hashedPassword, phone, country, experience, newsletter ? 1 : 0],
                function (err) {
                    if (err) {
                        console.error('Error creating user:', err);
                        return res.status(500).json({ error: 'Failed to create user' });
                    }

                    const userId = this.lastID;

                    // Send welcome email
                    const welcomeEmailBody = `
                        <h2>مرحباً ${firstName}!</h2>
                        <p>شكراً لانضمامك إلى دورة البرمجة!</p>
                        <p>تم إنشاء حسابك بنجاح. يمكنك الآن الوصول إلى جميع الكورسات والموارد.</p>
                        <p>مع تحيات فريق دورة البرمجة</p>
                    `;

                    sendEmailNotification(email, 'مرحباً بك في دورة البرمجة!', welcomeEmailBody);

                    // Send admin notification
                    const adminNotificationBody = `
                        <h2>مستخدم جديد انضم إلى الموقع</h2>
                        <p><strong>الاسم:</strong> ${firstName} ${lastName}</p>
                        <p><strong>البريد الإلكتروني:</strong> ${email}</p>
                        <p><strong>الهاتف:</strong> ${phone || 'غير محدد'}</p>
                        <p><strong>البلد:</strong> ${country}</p>
                        <p><strong>مستوى الخبرة:</strong> ${experience}</p>
                        <p><strong>الاشتراك في النشرة:</strong> ${newsletter ? 'نعم' : 'لا'}</p>
                    `;

                    sendEmailNotification('mmhnoopm@gmail.com', 'مستخدم جديد - دورة البرمجة', adminNotificationBody);

                    res.status(201).json({
                        message: 'User created successfully',
                        userId: userId
                    });
                });
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            const token = generateToken(user);

            // Save session
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            db.run('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user.id, token, expiresAt.toISOString()]);

            // Send admin notification
            const adminNotificationBody = `
                <h2>تسجيل دخول جديد</h2>
                <p><strong>المستخدم:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>البريد الإلكتروني:</strong> ${user.email}</p>
                <p><strong>وقت تسجيل الدخول:</strong> ${new Date().toISOString()}</p>
            `;

            sendEmailNotification('mmhnoopm@gmail.com', 'تسجيل دخول - دورة البرمجة', adminNotificationBody);

            res.json({
                message: 'Login successful',
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
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Enhanced Google Authentication with Token Verification
app.post('/api/google-auth', async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ error: 'Google ID token is required' });
    }

    try {
        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: idToken,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        if (!email || !name) {
            return res.status(400).json({ error: 'Invalid Google token' });
        }

        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ? OR googleId = ?', [email, googleId], async (err, existingUser) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            let user;

            if (existingUser) {
                // Update existing user with Google ID if not already linked
                if (!existingUser.googleId) {
                    db.run('UPDATE users SET googleId = ?, profileImage = ?, emailVerified = 1 WHERE id = ?',
                        [googleId, picture, existingUser.id]);
                }
                user = existingUser;
            } else {
                // Create new user
                const nameParts = name.split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ') || '';

                db.run('INSERT INTO users (firstName, lastName, email, googleId, profileImage, emailVerified) VALUES (?, ?, ?, ?, ?, ?)',
                    [firstName, lastName, email, googleId, picture, 1],
                    function (err) {
                        if (err) {
                            console.error('Error creating user:', err);
                            return res.status(500).json({ error: 'Failed to create user' });
                        }
                    });

                user = { id: this.lastID, firstName, lastName, email, googleId };
            }

            const token = generateToken(user);

            // Save session
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            db.run('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user.id, token, expiresAt.toISOString()]);

            // Send admin notification
            const adminNotificationBody = `
                <h2>تسجيل دخول عبر Google</h2>
                <p><strong>المستخدم:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>البريد الإلكتروني:</strong> ${user.email}</p>
                <p><strong>Google ID:</strong> ${googleId}</p>
                <p><strong>وقت تسجيل الدخول:</strong> ${new Date().toISOString()}</p>
            `;

            sendEmailNotification('mmhnoopm@gmail.com', 'تسجيل دخول عبر Google - دورة البرمجة', adminNotificationBody);

            res.json({
                message: 'Google authentication successful',
                token: token,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    profileImage: user.profileImage || picture
                }
            });
        });
    } catch (error) {
        console.error('Error verifying Google token:', error);
        res.status(400).json({ error: 'Invalid Google token' });
    }
});

// Legacy Google account linking (for backward compatibility)
app.post('/api/link-google-account', async (req, res) => {
    const { googleId, email, name, imageUrl } = req.body;

    if (!googleId || !email || !name) {
        return res.status(400).json({ error: 'Google ID, email, and name are required' });
    }

    try {
        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ? OR googleId = ?', [email, googleId], async (err, existingUser) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            let user;

            if (existingUser) {
                // Update existing user with Google ID
                if (!existingUser.googleId) {
                    db.run('UPDATE users SET googleId = ?, profileImage = ? WHERE id = ?',
                        [googleId, imageUrl, existingUser.id]);
                }
                user = existingUser;
            } else {
                // Create new user
                const nameParts = name.split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ') || '';

                db.run('INSERT INTO users (firstName, lastName, email, googleId, profileImage, emailVerified) VALUES (?, ?, ?, ?, ?, ?)',
                    [firstName, lastName, email, googleId, imageUrl, 1],
                    function (err) {
                        if (err) {
                            console.error('Error creating user:', err);
                            return res.status(500).json({ error: 'Failed to create user' });
                        }
                    });

                user = { id: this.lastID, firstName, lastName, email, googleId };
            }

            const token = generateToken(user);

            // Save session
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            db.run('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user.id, token, expiresAt.toISOString()]);

            // Send admin notification
            const adminNotificationBody = `
                <h2>تسجيل دخول عبر Google</h2>
                <p><strong>المستخدم:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>البريد الإلكتروني:</strong> ${user.email}</p>
                <p><strong>Google ID:</strong> ${googleId}</p>
                <p><strong>وقت تسجيل الدخول:</strong> ${new Date().toISOString()}</p>
            `;

            sendEmailNotification('mmhnoopm@gmail.com', 'تسجيل دخول عبر Google - دورة البرمجة', adminNotificationBody);

            res.json({
                message: 'Google account linked successfully',
                token: token,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                }
            });
        });
    } catch (error) {
        console.error('Error linking Google account:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Enhanced Facebook Authentication with Token Verification
app.post('/api/facebook-auth', async (req, res) => {
    const { accessToken } = req.body;

    if (!accessToken) {
        return res.status(400).json({ error: 'Facebook access token is required' });
    }

    try {
        // Verify the Facebook access token
        const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
        const { id: facebookId, name, email, picture } = response.data;

        if (!email || !name) {
            return res.status(400).json({ error: 'Invalid Facebook token' });
        }

        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ? OR facebookId = ?', [email, facebookId], async (err, existingUser) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            let user;

            if (existingUser) {
                // Update existing user with Facebook ID if not already linked
                if (!existingUser.facebookId) {
                    db.run('UPDATE users SET facebookId = ?, profileImage = ?, emailVerified = 1 WHERE id = ?',
                        [facebookId, picture.data?.url, existingUser.id]);
                }
                user = existingUser;
            } else {
                // Create new user
                const nameParts = name.split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ') || '';

                db.run('INSERT INTO users (firstName, lastName, email, facebookId, profileImage, emailVerified) VALUES (?, ?, ?, ?, ?, ?)',
                    [firstName, lastName, email, facebookId, picture.data?.url, 1],
                    function (err) {
                        if (err) {
                            console.error('Error creating user:', err);
                            return res.status(500).json({ error: 'Failed to create user' });
                        }
                    });

                user = { id: this.lastID, firstName, lastName, email, facebookId };
            }

            const token = generateToken(user);

            // Save session
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            db.run('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user.id, token, expiresAt.toISOString()]);

            // Send admin notification
            const adminNotificationBody = `
                <h2>تسجيل دخول عبر Facebook</h2>
                <p><strong>المستخدم:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>البريد الإلكتروني:</strong> ${user.email}</p>
                <p><strong>Facebook ID:</strong> ${facebookId}</p>
                <p><strong>وقت تسجيل الدخول:</strong> ${new Date().toISOString()}</p>
            `;

            sendEmailNotification('mmhnoopm@gmail.com', 'تسجيل دخول عبر Facebook - دورة البرمجة', adminNotificationBody);

            res.json({
                message: 'Facebook authentication successful',
                token: token,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    profileImage: user.profileImage || picture.data?.url
                }
            });
        });
    } catch (error) {
        console.error('Error verifying Facebook token:', error);
        res.status(400).json({ error: 'Invalid Facebook token' });
    }
});

// Legacy Facebook account linking (for backward compatibility)
app.post('/api/link-facebook-account', async (req, res) => {
    const { facebookId, email, name } = req.body;

    if (!facebookId || !email || !name) {
        return res.status(400).json({ error: 'Facebook ID, email, and name are required' });
    }

    try {
        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ? OR facebookId = ?', [email, facebookId], async (err, existingUser) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            let user;

            if (existingUser) {
                // Update existing user with Facebook ID
                if (!existingUser.facebookId) {
                    db.run('UPDATE users SET facebookId = ? WHERE id = ?', [facebookId, existingUser.id]);
                }
                user = existingUser;
            } else {
                // Create new user
                const nameParts = name.split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ') || '';

                db.run('INSERT INTO users (firstName, lastName, email, facebookId, emailVerified) VALUES (?, ?, ?, ?, ?)',
                    [firstName, lastName, email, facebookId, 1],
                    function (err) {
                        if (err) {
                            console.error('Error creating user:', err);
                            return res.status(500).json({ error: 'Failed to create user' });
                        }
                    });

                user = { id: this.lastID, firstName, lastName, email, facebookId };
            }

            const token = generateToken(user);

            // Save session
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            db.run('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user.id, token, expiresAt.toISOString()]);

            // Send admin notification
            const adminNotificationBody = `
                <h2>تسجيل دخول عبر Facebook</h2>
                <p><strong>المستخدم:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>البريد الإلكتروني:</strong> ${user.email}</p>
                <p><strong>Facebook ID:</strong> ${facebookId}</p>
                <p><strong>وقت تسجيل الدخول:</strong> ${new Date().toISOString()}</p>
            `;

            sendEmailNotification('mmhnoopm@gmail.com', 'تسجيل دخول عبر Facebook - دورة البرمجة', adminNotificationBody);

            res.json({
                message: 'Facebook account linked successfully',
                token: token,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                }
            });
        });
    } catch (error) {
        console.error('Error linking Facebook account:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Social registration
app.post('/api/social-register', async (req, res) => {
    const { firstName, lastName, email, googleId, facebookId, profileImage, newsletter } = req.body;

    if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    try {
        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Create new user
            db.run('INSERT INTO users (firstName, lastName, email, googleId, facebookId, profileImage, newsletter, emailVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [firstName, lastName, email, googleId, facebookId, profileImage, newsletter ? 1 : 0, 1],
                function (err) {
                    if (err) {
                        console.error('Error creating user:', err);
                        return res.status(500).json({ error: 'Failed to create user' });
                    }

                    const userId = this.lastID;
                    const user = { id: userId, firstName, lastName, email };

                    const token = generateToken(user);

                    // Save session
                    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    db.run('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
                        [userId, token, expiresAt.toISOString()]);

                    // Send welcome email
                    const welcomeEmailBody = `
                        <h2>مرحباً ${firstName}!</h2>
                        <p>شكراً لانضمامك إلى دورة البرمجة!</p>
                        <p>تم إنشاء حسابك بنجاح عبر ${googleId ? 'Google' : 'Facebook'}. يمكنك الآن الوصول إلى جميع الكورسات والموارد.</p>
                        <p>مع تحيات فريق دورة البرمجة</p>
                    `;

                    sendEmailNotification(email, 'مرحباً بك في دورة البرمجة!', welcomeEmailBody);

                    // Send admin notification
                    const adminNotificationBody = `
                        <h2>مستخدم جديد - تسجيل عبر ${googleId ? 'Google' : 'Facebook'}</h2>
                        <p><strong>الاسم:</strong> ${firstName} ${lastName}</p>
                        <p><strong>البريد الإلكتروني:</strong> ${email}</p>
                        <p><strong>طريقة التسجيل:</strong> ${googleId ? 'Google' : 'Facebook'}</p>
                        <p><strong>الاشتراك في النشرة:</strong> ${newsletter ? 'نعم' : 'لا'}</p>
                    `;

                    sendEmailNotification('mmhnoopm@gmail.com', 'مستخدم جديد - دورة البرمجة', adminNotificationBody);

                    res.status(201).json({
                        message: 'User created successfully',
                        token: token,
                        user: {
                            id: userId,
                            firstName: firstName,
                            lastName: lastName,
                            email: email
                        }
                    });
                });
        });
    } catch (error) {
        console.error('Error during social registration:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user profile
app.get('/api/profile', verifyToken, (req, res) => {
    const userId = req.user.userId;

    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                country: user.country,
                experience: user.experience,
                newsletter: user.newsletter,
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified,
                profileImage: user.profileImage
            }
        });
    });
});

// Update user profile
app.put('/api/profile', verifyToken, (req, res) => {
    const userId = req.user.userId;
    const { firstName, lastName, email, phone, country, experience, newsletter } = req.body;

    const updateFields = [];
    const values = [];

    if (firstName) { updateFields.push('firstName = ?'); values.push(firstName); }
    if (lastName) { updateFields.push('lastName = ?'); values.push(lastName); }
    if (email) { updateFields.push('email = ?'); values.push(email); }
    if (phone !== undefined) { updateFields.push('phone = ?'); values.push(phone); }
    if (country) { updateFields.push('country = ?'); values.push(country); }
    if (experience) { updateFields.push('experience = ?'); values.push(experience); }
    if (newsletter !== undefined) { updateFields.push('newsletter = ?'); values.push(newsletter ? 1 : 0); }

    if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    db.run(query, values, function (err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Profile updated successfully' });
    });
});

// Change password
app.post('/api/change-password', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
    }

    try {
        // Get user current password
        db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }

            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            db.run('UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedNewPassword, userId], (err) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Database error' });
                    }

                    res.json({ message: 'Password changed successfully' });
                });
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete account
app.delete('/api/delete-account', verifyToken, (req, res) => {
    const userId = req.user.userId;

    // Delete user data in transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Delete user sessions
        db.run('DELETE FROM user_sessions WHERE user_id = ?', [userId]);

        // Delete course progress
        db.run('DELETE FROM course_progress WHERE user_id = ?', [userId]);

        // Delete verification codes
        db.run('DELETE FROM verification_codes WHERE email IN (SELECT email FROM users WHERE id = ?)', [userId]);

        // Delete user
        db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
            if (err) {
                console.error('Database error:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Database error' });
            }

            db.run('COMMIT');
            res.json({ message: 'Account deleted successfully' });
        });
    });
});

// Get course progress
app.get('/api/course-progress', verifyToken, (req, res) => {
    const userId = req.user.userId;

    db.all(`
        SELECT 
            course_name,
            COUNT(*) as total_lessons,
            SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_lessons
        FROM course_progress 
        WHERE user_id = ? 
        GROUP BY course_name
    `, [userId], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const progress = rows.map(row => ({
            course_name: row.course_name,
            total_lessons: row.total_lessons,
            completed_lessons: row.completed_lessons,
            progress_percentage: Math.round((row.completed_lessons / row.total_lessons) * 100)
        }));

        res.json({ progress });
    });
});

// Save course progress
app.post('/api/course-progress', verifyToken, (req, res) => {
    const userId = req.user.userId;
    const { courseName, lessonNumber } = req.body;

    if (!courseName || !lessonNumber) {
        return res.status(400).json({ error: 'Course name and lesson number are required' });
    }

    db.run(`
        INSERT OR REPLACE INTO course_progress (user_id, course_name, lesson_number, completed, completed_at) 
        VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
    `, [userId, courseName, lessonNumber], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Progress saved successfully' });
    });
});

// Contact form
app.post('/api/contact', (req, res) => {
    const { firstName, lastName, email, phone, subject, message, newsletter } = req.body;

    if (!firstName || !lastName || !email || !subject || !message) {
        return res.status(400).json({ error: 'All required fields must be filled' });
    }

    db.run('INSERT INTO contact_messages (firstName, lastName, email, phone, subject, message, newsletter) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [firstName, lastName, email, phone, subject, message, newsletter ? 1 : 0],
        function (err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Send admin notification
            const adminNotificationBody = `
                <h2>رسالة جديدة من نموذج الاتصال</h2>
                <p><strong>الاسم:</strong> ${firstName} ${lastName}</p>
                <p><strong>البريد الإلكتروني:</strong> ${email}</p>
                <p><strong>الهاتف:</strong> ${phone || 'غير محدد'}</p>
                <p><strong>الموضوع:</strong> ${subject}</p>
                <p><strong>الرسالة:</strong></p>
                <p>${message}</p>
                <p><strong>الاشتراك في النشرة:</strong> ${newsletter ? 'نعم' : 'لا'}</p>
            `;

            sendEmailNotification('mmhnoopm@gmail.com', `رسالة جديدة: ${subject}`, adminNotificationBody);

            res.json({ message: 'Message sent successfully' });
        });
});

// Logout
app.post('/api/logout', verifyToken, (req, res) => {
    const token = req.headers.authorization.split(' ')[1];

    db.run('DELETE FROM user_sessions WHERE token = ?', [token], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Logged out successfully' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
