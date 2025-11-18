<?php
require_once '../config/cors.php';
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

    case 'POST':
        try {
            $data = json_decode(file_get_contents("php://input"));
            
            // Insert new weather data
            $stmt = $db->prepare("INSERT INTO weather (user_id, location, temperature, condition, humidity, recommendation) 
                                 VALUES (:user_id, :location, :temperature, :condition, :humidity, :recommendation)");
            
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':location', $data->location);
            $stmt->bindParam(':temperature', $data->temperature);
            $stmt->bindParam(':condition', $data->condition);
            $stmt->bindParam(':humidity', $data->humidity);
            $stmt->bindParam(':recommendation', $data->recommendation);
            
            if($stmt->execute()) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Weather data updated successfully'
                ]);
            } else {
                throw new Exception('Failed to update weather data');
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>