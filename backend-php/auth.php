<?php
require_once 'config.php';

class Auth {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    public function generateJWT($userId, $email) {
        $header = json_encode(['typ' => 'JWT', 'alg' => JWT_ALGORITHM]);
        $payload = json_encode([
            'userId' => $userId,
            'email' => $email,
            'iat' => time(),
            'exp' => time() + TOKEN_EXPIRY
        ]);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, JWT_SECRET, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    public function validateJWT($token) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return false;
        }
        
        $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[0]));
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1]));
        $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[2]));
        
        $expectedSignature = hash_hmac('sha256', $parts[0] . "." . $parts[1], JWT_SECRET, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            return false;
        }
        
        $payloadData = json_decode($payload, true);
        
        if ($payloadData['exp'] < time()) {
            return false;
        }
        
        return $payloadData;
    }
    
    public function getCurrentUser() {
        $headers = getallheaders();
        $token = null;
        
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }
        
        if (!$token) {
            return null;
        }
        
        $payload = $this->validateJWT($token);
        if (!$payload) {
            return null;
        }
        
        $stmt = $this->db->prepare("SELECT id, firstName, lastName, email, phone, country, experience, newsletter FROM users WHERE id = ?");
        $stmt->execute([$payload['userId']]);
        $user = $stmt->fetch();
        
        return $user;
    }
    
    public function logout() {
        $user = $this->getCurrentUser();
        if ($user) {
            $stmt = $this->db->prepare("DELETE FROM user_sessions WHERE user_id = ?");
            $stmt->execute([$user['id']]);
        }
    }
    
    public function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }
    
    public function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    public function generateResetToken() {
        return bin2hex(random_bytes(32));
    }
    
    public function createPasswordReset($email, $token) {
        $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour
        
        $stmt = $this->db->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
        return $stmt->execute([$email, $token, $expiresAt]);
    }
    
    public function validateResetToken($token) {
        $stmt = $this->db->prepare("SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW()");
        $stmt->execute([$token]);
        $result = $stmt->fetch();
        
        if ($result) {
            // Delete used token
            $stmt = $this->db->prepare("DELETE FROM password_resets WHERE token = ?");
            $stmt->execute([$token]);
            return $result['email'];
        }
        
        return false;
    }
}

// Helper function to generate JWT (for use in index.php)
function generateJWT($userId, $email) {
    $auth = new Auth();
    return $auth->generateJWT($userId, $email);
}
?>
