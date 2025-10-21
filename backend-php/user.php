<?php
require_once 'config.php';
require_once 'database.php';
require_once 'auth.php';

class UserManager {
    private $db;
    private $auth;
    
    public function __construct() {
        $this->db = new Database();
        $this->auth = new Auth();
    }
    
    public function userExists($email) {
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch() !== false;
    }
    
    public function createUser($userData) {
        try {
            $this->db->beginTransaction();
            
            $hashedPassword = $this->auth->hashPassword($userData['password']);
            
            $stmt = $this->db->prepare("
                INSERT INTO users (firstName, lastName, email, phone, country, experience, password, newsletter) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $userData['firstName'],
                $userData['lastName'],
                $userData['email'],
                $userData['phone'],
                $userData['country'],
                $userData['experience'],
                $hashedPassword,
                $userData['newsletter'] ? 1 : 0
            ]);
            
            if ($result) {
                $userId = $this->db->lastInsertId();
                $this->db->commit();
                return $userId;
            } else {
                $this->db->rollback();
                return false;
            }
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    public function authenticateUser($email, $password) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && $this->auth->verifyPassword($password, $user['password'])) {
            // Remove password from returned data
            unset($user['password']);
            return $user;
        }
        
        return false;
    }
    
    public function updateUser($userId, $userData) {
        $fields = [];
        $values = [];
        
        $allowedFields = ['firstName', 'lastName', 'email', 'phone', 'country', 'experience', 'newsletter'];
        
        foreach ($allowedFields as $field) {
            if (isset($userData[$field])) {
                $fields[] = "$field = ?";
                if ($field === 'newsletter') {
                    $values[] = $userData[$field] ? 1 : 0;
                } else {
                    $values[] = $userData[$field];
                }
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $userId;
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($values);
    }
    
    public function changePassword($userId, $currentPassword, $newPassword) {
        // Verify current password
        $stmt = $this->db->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user || !$this->auth->verifyPassword($currentPassword, $user['password'])) {
            return false;
        }
        
        // Update password
        $hashedPassword = $this->auth->hashPassword($newPassword);
        $stmt = $this->db->prepare("UPDATE users SET password = ? WHERE id = ?");
        return $stmt->execute([$hashedPassword, $userId]);
    }
    
    public function deleteUser($userId) {
        try {
            $this->db->beginTransaction();
            
            // Delete related data
            $stmt = $this->db->prepare("DELETE FROM user_sessions WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            $stmt = $this->db->prepare("DELETE FROM course_progress WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            $stmt = $this->db->prepare("DELETE FROM password_resets WHERE email IN (SELECT email FROM users WHERE id = ?)");
            $stmt->execute([$userId]);
            
            // Delete user
            $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
            $result = $stmt->execute([$userId]);
            
            if ($result) {
                $this->db->commit();
                return true;
            } else {
                $this->db->rollback();
                return false;
            }
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    public function getCourseProgress($userId) {
        $stmt = $this->db->prepare("
            SELECT 
                course_name,
                COUNT(*) as total_lessons,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_lessons,
                ROUND((SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) as progress_percentage
            FROM course_progress 
            WHERE user_id = ? 
            GROUP BY course_name
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }
    
    public function saveCourseProgress($userId, $courseName, $lessonNumber) {
        $stmt = $this->db->prepare("
            INSERT INTO course_progress (user_id, course_name, lesson_number, completed, completed_at) 
            VALUES (?, ?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE 
            completed = 1, 
            completed_at = NOW()
        ");
        
        return $stmt->execute([$userId, $courseName, $lessonNumber]);
    }
    
    public function getUserStats($userId) {
        $stats = [];
        
        // Get completed courses count
        $stmt = $this->db->prepare("
            SELECT COUNT(DISTINCT course_name) as completed_courses
            FROM course_progress 
            WHERE user_id = ? AND completed = 1
        ");
        $stmt->execute([$userId]);
        $stats['completed_courses'] = $stmt->fetch()['completed_courses'];
        
        // Get total lessons completed
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as total_lessons
            FROM course_progress 
            WHERE user_id = ? AND completed = 1
        ");
        $stmt->execute([$userId]);
        $stats['total_lessons'] = $stmt->fetch()['total_lessons'];
        
        // Get study hours (estimated)
        $stats['study_hours'] = round($stats['total_lessons'] * 1.5, 1);
        
        // Get certificates (same as completed courses)
        $stats['certificates'] = $stats['completed_courses'];
        
        return $stats;
    }
    
    public function getUserById($userId) {
        $stmt = $this->db->prepare("
            SELECT id, firstName, lastName, email, phone, country, experience, newsletter, created_at 
            FROM users WHERE id = ?
        ");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }
    
    public function getUserByEmail($email) {
        $stmt = $this->db->prepare("
            SELECT id, firstName, lastName, email, phone, country, experience, newsletter, created_at 
            FROM users WHERE email = ?
        ");
        $stmt->execute([$email]);
        return $stmt->fetch();
    }
    
    public function getAllUsers($limit = 50, $offset = 0) {
        $stmt = $this->db->prepare("
            SELECT id, firstName, lastName, email, phone, country, experience, newsletter, created_at 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    }
    
    public function searchUsers($query, $limit = 50) {
        $stmt = $this->db->prepare("
            SELECT id, firstName, lastName, email, phone, country, experience, newsletter, created_at 
            FROM users 
            WHERE firstName LIKE ? OR lastName LIKE ? OR email LIKE ?
            ORDER BY created_at DESC 
            LIMIT ?
        ");
        $searchTerm = "%$query%";
        $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $limit]);
        return $stmt->fetchAll();
    }
}
?>
