<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$user_id = 1;

try {
    // Get analytics data for charts
    $plant_health = [
        'labels' => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        'datasets' => [
            [
                'label' => 'Plant Health Score',
                'data' => [75, 78, 82, 80, 85, 88],
                'borderColor' => '#7db36e',
                'backgroundColor' => 'rgba(125, 179, 110, 0.1)'
            ],
            [
                'label' => 'Growth Rate',
                'data' => [65, 70, 75, 78, 82, 85],
                'borderColor' => '#ffd8a6',
                'backgroundColor' => 'rgba(255, 216, 166, 0.1)'
            ]
        ]
    ];

    // Plant status distribution
    $status_distribution = $db->query(
        "SELECT status, COUNT(*) as count FROM plants WHERE user_id = $user_id GROUP BY status"
    )->fetchAll();

    // Task completion rate
    $completion_stats = $db->query(
        "SELECT 
            COUNT(*) as total_tasks,
            SUM(completed) as completed_tasks,
            ROUND((SUM(completed) / COUNT(*)) * 100) as completion_rate
         FROM tasks WHERE user_id = $user_id"
    )->fetch();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'plantHealth' => $plant_health,
            'statusDistribution' => $status_distribution,
            'completionStats' => $completion_stats
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch analytics: ' . $e->getMessage()
    ]);
}
?>