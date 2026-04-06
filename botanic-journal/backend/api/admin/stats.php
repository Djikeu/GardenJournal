<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$current_user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if (!$current_user_id) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit();
}

// Verify admin
$check_stmt = $db->prepare("SELECT role FROM users WHERE id = :id");
$check_stmt->bindParam(':id', $current_user_id);
$check_stmt->execute();
$user_role = $check_stmt->fetchColumn();

if ($user_role !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin access required']);
    exit();
}

// Get stats
$stats = [];

// Total users
$stmt = $db->query("SELECT COUNT(*) as count FROM users");
$stats['totalUsers'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

// Total plants
$stmt = $db->query("SELECT COUNT(*) as count FROM plants");
$stats['totalPlants'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

// Active tasks
$stmt = $db->query("SELECT COUNT(*) as count FROM tasks WHERE completed = 0");
$stats['activeTasks'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

// Admin users
$stmt = $db->query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
$stats['adminUsers'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

// Total journals
$stmt = $db->query("SELECT COUNT(*) as count FROM journals");
$stats['totalJournals'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

// Total discussions
$stmt = $db->query("SELECT COUNT(*) as count FROM community_discussions");
$stats['totalDiscussions'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

echo json_encode(['success' => true, 'data' => $stats]);
?>