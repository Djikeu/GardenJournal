<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get user_id from request
$user_id = $_GET['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User ID required']);
    exit();
}

try {
    // Get all user plants
    $stmt = $db->prepare("
        SELECT 
            id, name, species, type, status, 
            is_favorite, created_at, updated_at,
            light_requirements, watering_schedule,
            temperature_range, humidity_requirements
        FROM plants 
        WHERE user_id = :user_id 
        ORDER BY created_at DESC
    ");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    $plants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get plant count by type
    $typeStmt = $db->prepare("
        SELECT type, COUNT(*) as count 
        FROM plants 
        WHERE user_id = :user_id 
        GROUP BY type
    ");
    $typeStmt->bindParam(':user_id', $user_id);
    $typeStmt->execute();
    $types = $typeStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get plant count by status
    $statusStmt = $db->prepare("
        SELECT status, COUNT(*) as count 
        FROM plants 
        WHERE user_id = :user_id 
        GROUP BY status
    ");
    $statusStmt->bindParam(':user_id', $user_id);
    $statusStmt->execute();
    $statuses = $statusStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get recent plants (last 30 days)
    $recentStmt = $db->prepare("
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM plants 
        WHERE user_id = :user_id AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
    ");
    $recentStmt->bindParam(':user_id', $user_id);
    $recentStmt->execute();
    $recent = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate statistics
    $totalPlants = count($plants);
    $favorites = array_filter($plants, fn($p) => $p['is_favorite']);
    $healthyPlants = array_filter($plants, fn($p) => $p['status'] === 'healthy');
    
    // Generate time series data for charts
    $last6Months = [];
    $currentMonth = date('n');
    for ($i = 5; $i >= 0; $i--) {
        $monthNum = (($currentMonth - $i - 1) % 12) + 1;
        $monthName = date('M', mktime(0, 0, 0, $monthNum, 1));
        $last6Months[] = $monthName;
    }

    // In a real app, you'd track actual health scores over time
    // For now, we'll generate realistic demo data
    $healthScores = [];
    $growthData = [];
    
    // Simulate improving health over time
    $baseScore = $totalPlants > 0 ? 70 : 60;
    for ($i = 0; $i < 6; $i++) {
        $score = $baseScore + ($i * 3) + rand(-2, 5);
        $healthScores[] = min($score, 95);
        $growthData[] = max(0, $totalPlants - (5 - $i));
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'totalPlants' => $totalPlants,
            'favorites' => count($favorites),
            'healthyPlants' => count($healthyPlants),
            'types' => $types,
            'statuses' => $statuses,
            'recentActivity' => $recent,
            'timeSeries' => [
                'labels' => $last6Months,
                'healthScores' => $healthScores,
                'growthData' => $growthData
            ],
            'plants' => $plants
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>