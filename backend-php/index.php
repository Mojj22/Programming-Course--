<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
require_once 'database.php';
require_once 'auth.php';
require_once 'user.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
$path = parse_url($path, PHP_URL_PATH);
$path = str_replace('/backend-php', '', $path);

// Route requests
switch ($path) {
    case '/api/register':
        if ($method === 'POST') {
            handleRegister();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
        
    case '/api/login':
        if ($method === 'POST') {
            handleLogin();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
        
    case '/api/profile':
        if ($method === 'GET') {
            handleGetProfile();
        } elseif ($method === 'PUT') {
            handleUpdateProfile();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
        
    case '/api/logout':
        if ($method === 'POST') {
            handleLogout();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
        
    case '/api/change-password':
        if ($method === 'POST') {
            handleChangePassword();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
        
    case '/api/delete-account':
        if ($method === 'DELETE') {
            handleDeleteAccount();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
        
    case '/api/course-progress':
        if ($method === 'GET') {
            handleGetCourseProgress();
        } elseif ($method === 'POST') {
            handleSaveCourseProgress();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
        
    case '/api/contact':
        if ($method === 'POST') {
            handleContact();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}

function handleRegister() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required = ['firstName', 'lastName', 'email', 'password', 'country', 'experience'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => ucfirst($field) . ' is required']);
            return;
        }
    }
    
    // Validate email format
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        return;
    }
    
    // Validate password strength
    if (strlen($input['password']) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters long']);
        return;
    }
    
    $userManager = new UserManager();
    
    // Check if user already exists
    if ($userManager->userExists($input['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'User already exists']);
        return;
    }
    
    // Create user
    $userId = $userManager->createUser([
        'firstName' => $input['firstName'],
        'lastName' => $input['lastName'],
        'email' => $input['email'],
        'phone' => $input['phone'] ?? '',
        'country' => $input['country'],
        'experience' => $input['experience'],
        'password' => $input['password'],
        'newsletter' => $input['newsletter'] ?? false
    ]);
    
    if ($userId) {
        // Send welcome email
        sendWelcomeEmail($input['email'], $input['firstName']);
        
        // Send admin notification
        sendAdminNotification('registration', $input);
        
        echo json_encode(['success' => true, 'message' => 'User created successfully', 'userId' => $userId]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create user']);
    }
}

function handleLogin() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($input['email']) || empty($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }
    
    $userManager = new UserManager();
    $user = $userManager->authenticateUser($input['email'], $input['password']);
    
    if ($user) {
        // Generate JWT token
        $token = generateJWT($user['id'], $user['email']);
        
        // Send admin notification
        sendAdminNotification('login', $user);
        
        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'firstName' => $user['firstName'],
                'lastName' => $user['lastName'],
                'email' => $user['email'],
                'experience' => $user['experience']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }
}

function handleGetProfile() {
    $auth = new Auth();
    $user = $auth->getCurrentUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    echo json_encode(['success' => true, 'user' => $user]);
}

function handleUpdateProfile() {
    $auth = new Auth();
    $user = $auth->getCurrentUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userManager = new UserManager();
    $updated = $userManager->updateUser($user['id'], $input);
    
    if ($updated) {
        echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update profile']);
    }
}

function handleLogout() {
    $auth = new Auth();
    $auth->logout();
    
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
}

function handleChangePassword() {
    $auth = new Auth();
    $user = $auth->getCurrentUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['currentPassword']) || empty($input['newPassword'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Current password and new password are required']);
        return;
    }
    
    if (strlen($input['newPassword']) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'New password must be at least 8 characters long']);
        return;
    }
    
    $userManager = new UserManager();
    $updated = $userManager->changePassword($user['id'], $input['currentPassword'], $input['newPassword']);
    
    if ($updated) {
        echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid current password']);
    }
}

function handleDeleteAccount() {
    $auth = new Auth();
    $user = $auth->getCurrentUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $userManager = new UserManager();
    $deleted = $userManager->deleteUser($user['id']);
    
    if ($deleted) {
        $auth->logout();
        echo json_encode(['success' => true, 'message' => 'Account deleted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete account']);
    }
}

function handleGetCourseProgress() {
    $auth = new Auth();
    $user = $auth->getCurrentUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $userManager = new UserManager();
    $progress = $userManager->getCourseProgress($user['id']);
    
    echo json_encode(['success' => true, 'progress' => $progress]);
}

function handleSaveCourseProgress() {
    $auth = new Auth();
    $user = $auth->getCurrentUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['courseName']) || empty($input['lessonNumber'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Course name and lesson number are required']);
        return;
    }
    
    $userManager = new UserManager();
    $saved = $userManager->saveCourseProgress($user['id'], $input['courseName'], $input['lessonNumber']);
    
    if ($saved) {
        echo json_encode(['success' => true, 'message' => 'Progress saved successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save progress']);
    }
}

function handleContact() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required = ['firstName', 'lastName', 'email', 'subject', 'message'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => ucfirst($field) . ' is required']);
            return;
        }
    }
    
    // Validate email format
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        return;
    }
    
    // Save contact message
    $db = new Database();
    $stmt = $db->prepare("INSERT INTO contact_messages (firstName, lastName, email, phone, subject, message, newsletter) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $result = $stmt->execute([
        $input['firstName'],
        $input['lastName'],
        $input['email'],
        $input['phone'] ?? '',
        $input['subject'],
        $input['message'],
        $input['newsletter'] ?? false
    ]);
    
    if ($result) {
        // Send admin notification
        sendAdminNotification('contact', $input);
        
        echo json_encode(['success' => true, 'message' => 'Message sent successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to send message']);
    }
}

function sendWelcomeEmail($email, $firstName) {
    $subject = 'مرحباً بك في دورة البرمجة!';
    $message = "
        <h2>مرحباً $firstName!</h2>
        <p>شكراً لانضمامك إلى دورة البرمجة!</p>
        <p>تم إنشاء حسابك بنجاح. يمكنك الآن الوصول إلى جميع الكورسات والموارد.</p>
        <p>مع تحيات فريق دورة البرمجة</p>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: mmhnoopm@gmail.com";
    
    mail($email, $subject, $message, $headers);
}

function sendAdminNotification($type, $data) {
    $adminEmail = 'mmhnoopm@gmail.com';
    
    switch ($type) {
        case 'registration':
            $subject = 'مستخدم جديد - دورة البرمجة';
            $message = "
                <h2>مستخدم جديد انضم إلى الموقع</h2>
                <p><strong>الاسم:</strong> {$data['firstName']} {$data['lastName']}</p>
                <p><strong>البريد الإلكتروني:</strong> {$data['email']}</p>
                <p><strong>الهاتف:</strong> {$data['phone'] ?? 'غير محدد'}</p>
                <p><strong>البلد:</strong> {$data['country']}</p>
                <p><strong>مستوى الخبرة:</strong> {$data['experience']}</p>
                <p><strong>الاشتراك في النشرة:</strong> " . ($data['newsletter'] ? 'نعم' : 'لا') . "</p>
            ";
            break;
            
        case 'login':
            $subject = 'تسجيل دخول - دورة البرمجة';
            $message = "
                <h2>تسجيل دخول جديد</h2>
                <p><strong>المستخدم:</strong> {$data['firstName']} {$data['lastName']}</p>
                <p><strong>البريد الإلكتروني:</strong> {$data['email']}</p>
                <p><strong>وقت تسجيل الدخول:</strong> " . date('Y-m-d H:i:s') . "</p>
            ";
            break;
            
        case 'contact':
            $subject = 'رسالة جديدة - نموذج الاتصال';
            $message = "
                <h2>رسالة جديدة من نموذج الاتصال</h2>
                <p><strong>الاسم:</strong> {$data['firstName']} {$data['lastName']}</p>
                <p><strong>البريد الإلكتروني:</strong> {$data['email']}</p>
                <p><strong>الهاتف:</strong> {$data['phone'] ?? 'غير محدد'}</p>
                <p><strong>الموضوع:</strong> {$data['subject']}</p>
                <p><strong>الرسالة:</strong></p>
                <p>{$data['message']}</p>
                <p><strong>الاشتراك في النشرة:</strong> " . ($data['newsletter'] ? 'نعم' : 'لا') . "</p>
            ";
            break;
    }
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: mmhnoopm@gmail.com";
    
    mail($adminEmail, $subject, $message, $headers);
}
?>
