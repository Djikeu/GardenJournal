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

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        try {
            // Get latest weather data for user
            $stmt = $db->prepare("SELECT * FROM weather WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 1");
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            $weather = $stmt->fetch();
            
            if (!$weather) {
                // Return default weather data
                $weather = [
                    'location' => 'Portland, OR',
                    'temperature' => '68°F',
                    'condition' => 'Partly Cloudy',
                    'humidity' => '65%',
                    'recommendation' => 'Perfect day for transplanting seedlings and light pruning'
                ];
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $weather
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch weather: ' . $e->getMessage()
            ]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>