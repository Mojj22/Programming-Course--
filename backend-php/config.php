<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'programming_course');
define('DB_USER', 'root');
define('DB_PASS', '');

// JWT Configuration
define('JWT_SECRET', 'your-secret-key-change-in-production');
define('JWT_ALGORITHM', 'HS256');

// Email Configuration
define('ADMIN_EMAIL', 'mmhnoopm@gmail.com');
define('FROM_EMAIL', 'mmhnoopm@gmail.com');

// Security Configuration
define('PASSWORD_MIN_LENGTH', 8);
define('TOKEN_EXPIRY', 7 * 24 * 60 * 60); // 7 days in seconds

// Application Configuration
define('APP_NAME', 'Programming Course');
define('APP_URL', 'http://localhost');

// Error Reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Asia/Riyadh');

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 0); // Set to 1 for HTTPS
ini_set('session.use_strict_mode', 1);
?>
