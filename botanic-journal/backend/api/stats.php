<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$user_id = 1;

try {
    // Get stats
    $total_plants = $db->query("SELECT COUNT(*) as count FROM plants WHERE user_id = $user_id")->fetch()['count'];
    $pending_tasks = $db->query("SELECT COUNT(*) as count FROM tasks WHERE user_id = $user_id AND completed = 0")->fetch()['count'];
    $need_watering = $db->query("SELECT COUNT(*) as count FROM plants WHERE user_id = $user_id AND (last_watered IS NULL OR last_watered < DATE_SUB(CURDATE(), INTERVAL 3 DAY))")->fetch()['count'];

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'totalPlants' => (int)$total_plants,
            'pendingTasks' => (int)$pending_tasks,
            'needWatering' => (int)$need_watering
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch stats: ' . $e->getMessage()
    ]);
}
?>