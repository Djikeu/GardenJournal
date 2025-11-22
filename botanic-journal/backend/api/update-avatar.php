<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$user_id = 1; // In real app, get from JWT token

try {
    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error');
    }

    $file = $_FILES['avatar'];
    
    // Validate file type
    $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowed_types)) {
        throw new Exception('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
    }
    
    // Validate file size (5MB max)
    $max_size = 5 * 1024 * 1024;
    if ($file['size'] > $max_size) {
        throw new Exception('File size too large. Maximum size is 5MB.');
    }
    
    // Create uploads directory if it doesn't exist
    $upload_dir = '../uploads/avatars/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    // Generate unique filename
    $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'avatar_' . $user_id . '_' . time() . '.' . $file_extension;
    $file_path = $upload_dir . $filename;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $file_path)) {
        throw new Exception('Failed to save uploaded file');
    }
    
    // Update user avatar in database
    $avatar_url = '/uploads/avatars/' . $filename;
    $stmt = $db->prepare("UPDATE users SET avatar = :avatar, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
    $stmt->bindParam(':avatar', $avatar_url);
    $stmt->bindParam(':id', $user_id);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Avatar uploaded successfully',
            'avatarUrl' => $avatar_url
        ]);
    } else {
        throw new Exception('Failed to update avatar in database');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>