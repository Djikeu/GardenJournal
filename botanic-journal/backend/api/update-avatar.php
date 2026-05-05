<?php
ob_start();

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR])) {
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => $error['message'] . ' in ' . basename($error['file']) . ' line ' . $error['line']
        ]);
    }
});

ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) 
         : (isset($_POST['user_id']) ? intval($_POST['user_id']) 
         : null);

if (!$user_id) {
    http_response_code(401);
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
        $error_message = isset($_FILES['avatar']) 
            ? 'Upload error code: ' . $_FILES['avatar']['error'] 
            : 'No file uploaded';
        throw new Exception($error_message);
    }

    $file = $_FILES['avatar'];

    // Validate by extension
    $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($file_extension, $allowed_extensions)) {
        throw new Exception('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.');
    }

    // Validate file size (5MB max)
    $max_size = 5 * 1024 * 1024;
    if ($file['size'] > $max_size) {
        throw new Exception('File size too large. Maximum size is 5MB.');
    }

    // Create uploads directory if it doesn't exist
    $upload_dir = __DIR__ . '/../../uploads/avatars/';
    if (!is_dir($upload_dir)) {
        if (!mkdir($upload_dir, 0755, true)) {
            throw new Exception('Failed to create upload directory');
        }
    }

    // Generate unique filename
    $filename = 'avatar_' . $user_id . '_' . time() . '.' . $file_extension;
    $file_path = $upload_dir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $file_path)) {
        throw new Exception('Failed to save uploaded file. Check directory permissions.');
    }

    // Update user avatar in database
    $avatar_url = '/botanic-journal/botanic-journal/uploads/avatars/' . $filename;
    $stmt = $db->prepare("UPDATE users SET avatar = :avatar WHERE id = :id");
    $stmt->bindParam(':avatar', $avatar_url);
    $stmt->bindParam(':id', $user_id);

    if ($stmt->execute()) {
        ob_clean();
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
    ob_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>