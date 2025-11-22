<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get user ID from request
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 1;

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    try {
        // Get user's plant count
        $plant_stmt = $db->prepare("SELECT COUNT(*) as total_plants FROM plants WHERE user_id = :user_id");
        $plant_stmt->bindParam(':user_id', $user_id);
        $plant_stmt->execute();
        $plant_count = $plant_stmt->fetch(PDO::FETCH_ASSOC)['total_plants'];

        // Get user's pending tasks count
        $task_stmt = $db->prepare("SELECT COUNT(*) as pending_tasks FROM tasks WHERE user_id = :user_id AND completed = 0");
        $task_stmt->bindParam(':user_id', $user_id);
        $task_stmt->execute();
        $pending_tasks = $task_stmt->fetch(PDO::FETCH_ASSOC)['pending_tasks'];

        // Get completion rate
        $completion_stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_tasks
            FROM tasks 
            WHERE user_id = :user_id
        ");
        $completion_stmt->bindParam(':user_id', $user_id);
        $completion_stmt->execute();
        $completion_data = $completion_stmt->fetch(PDO::FETCH_ASSOC);
        
        $completion_rate = 0;
        if ($completion_data['total_tasks'] > 0) {
            $completion_rate = round(($completion_data['completed_tasks'] / $completion_data['total_tasks']) * 100);
        }

        // Get recent activity (last 5 activities)
        $activity_stmt = $db->prepare("
            SELECT 
                'task_completed' as type,
                'fas fa-check-circle' as icon,
                CONCAT('Completed: ', title) as title,
                updated_at as time
            FROM tasks 
            WHERE user_id = :user_id AND completed = 1
            UNION ALL
            SELECT 
                'plant_added' as type,
                'fas fa-seedling' as icon,
                CONCAT('Added: ', name) as title,
                created_at as time
            FROM plants 
            WHERE user_id = :user_id
            ORDER BY time DESC 
            LIMIT 5
        ");
        $activity_stmt->bindParam(':user_id', $user_id);
        $activity_stmt->execute();
        $recent_activity = $activity_stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format activity times
        foreach ($recent_activity as &$activity) {
            $time = new DateTime($activity['time']);
            $now = new DateTime();
            $diff = $now->diff($time);
            
            if ($diff->days > 0) {
                $activity['time'] = $diff->days . ' days ago';
            } elseif ($diff->h > 0) {
                $activity['time'] = $diff->h . ' hours ago';
            } else {
                $activity['time'] = 'Just now';
            }
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => [
                'totalPlants' => $plant_count,
                'pendingTasks' => $pending_tasks,
                'completionRate' => $completion_rate . '%',
                'recentActivity' => $recent_activity
            ]
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>