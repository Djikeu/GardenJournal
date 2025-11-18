<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$database = new Database();
$db = $database->getConnection();
$user_id = 1;

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
?>