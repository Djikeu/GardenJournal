<?php
// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'None');  // Changed from Lax to None
ini_set('session.cookie_secure', 0);
session_start();

// Debug: Log session data
error_log("Session ID: " . session_id());
error_log("Session Data: " . print_r($_SESSION, true));

// Verify admin authentication
function checkAdminAuth($db)
{
    $user_id = $_GET['user_id'] ?? null;

    if (!$user_id) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $stmt = $db->prepare("SELECT id, role FROM users WHERE id = :id AND is_active = 1");
    $stmt->bindParam(':id', $user_id);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || $user['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized: Admin access required']);
        exit();
    }

    return $user['id'];
}

$method = $_SERVER['REQUEST_METHOD'];
$database = new Database();
$db = $database->getConnection();

// Check authentication for all methods
$admin_id = checkAdminAuth($db);

// Handle _method override for PUT from FormData
if ($method === 'POST' && isset($_POST['_method']) && $_POST['_method'] === 'PUT') {
    $method = 'PUT';
}

switch ($method) {
    case 'GET':
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $offset = ($page - 1) * $limit;

        $query = "SELECT p.*, u.name as owner_name, u.email as owner_email 
                  FROM plants p
                  LEFT JOIN users u ON p.user_id = u.id
                  WHERE 1=1";
        $countQuery = "SELECT COUNT(*) as total FROM plants WHERE 1=1";

        if ($search) {
            $searchTerm = "%{$search}%";
            $query .= " AND (p.common_name LIKE :search OR p.scientific_name LIKE :search)";
            $countQuery .= " AND (common_name LIKE :search OR scientific_name LIKE :search)";
        }

        $query .= " ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($query);
        $countStmt = $db->prepare($countQuery);

        if ($search) {
            $stmt->bindParam(':search', $searchTerm);
            $countStmt->bindParam(':search', $searchTerm);
        }

        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);

        $stmt->execute();
        $plants = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $countStmt->execute();
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        echo json_encode([
            'success' => true,
            'data' => $plants,
            'pagination' => [
                'page' => $page,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
        break;

    case 'POST':
        try {
            // Map form fields to actual DB columns
            $name = $_POST['common_name'] ?? '';
            $species = $_POST['scientific_name'] ?? '';
            $description = $_POST['description'] ?? '';
            $care_instructions = $_POST['care_instructions'] ?? '{}';
            $growth_rate_raw = $_POST['growth_rate'] ?? 'medium';
            $difficulty_raw = $_POST['difficulty_level'] ?? 'beginner';
            $additional_info = $_POST['additional_info'] ?? '';

            // Map growth_rate to match DB enum('Slow','Moderate','Fast')
            $growth_rate_map = [
                'slow' => 'Slow',
                'medium' => 'Moderate',
                'fast' => 'Fast'
            ];
            $growth_rate = $growth_rate_map[$growth_rate_raw] ?? 'Moderate';

            // Map difficulty to match DB enum('Easy','Moderate','Advanced')
            $difficulty_map = [
                'beginner' => 'Easy',
                'intermediate' => 'Moderate',
                'advanced' => 'Advanced'
            ];
            $difficulty = $difficulty_map[$difficulty_raw] ?? 'Easy';

            // Map is_indoor/is_outdoor to DB enum type
            $is_indoor = isset($_POST['is_indoor']) && $_POST['is_indoor'] == '1';
            $is_outdoor = isset($_POST['is_outdoor']) && $_POST['is_outdoor'] == '1';
            if ($is_indoor && $is_outdoor) {
                $type = 'indoor'; // default to indoor if both checked
            } elseif ($is_outdoor) {
                $type = 'outdoor';
            } else {
                $type = 'indoor';
            }

            // Map care instructions JSON to individual columns
            $care = json_decode($care_instructions, true) ?? [];
            $watering_schedule = $care['watering'] ?? '';
            $light_requirements = $care['sunlight'] ?? '';
            $temperature_range = $care['temperature'] ?? '';
            $humidity_requirements = $care['humidity'] ?? '';

            if (empty($name)) {
                throw new Exception('Plant name is required');
            }

            // Handle image upload
            $main_image = '';
            if (isset($_FILES['images']) && !empty($_FILES['images']['name'][0])) {
                $uploadDir = __DIR__ . '/../../uploads/plants/';

                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                if (!is_writable($uploadDir)) {
                    throw new Exception('Upload directory is not writable');
                }

                $files = $_FILES['images'];
                $fileCount = is_array($files['name']) ? count($files['name']) : 1;

                for ($i = 0; $i < $fileCount; $i++) {
                    $fileName  = is_array($files['name'])     ? $files['name'][$i]     : $files['name'];
                    $fileTmp   = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
                    $fileError = is_array($files['error'])    ? $files['error'][$i]    : $files['error'];

                    if ($fileError !== UPLOAD_ERR_OK) {
                        throw new Exception('File upload error: ' . $fileError);
                    }

                    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
                        throw new Exception('Invalid file type: ' . $ext);
                    }

                    $newFileName = time() . '_' . uniqid() . '.' . $ext;
                    if (!move_uploaded_file($fileTmp, $uploadDir . $newFileName)) {
                        throw new Exception('Failed to save uploaded file');
                    }

                    // Only use first image as main image_url
                    if ($i === 0) {
                        $main_image = '/botanic-journal/botanic-journal/backend/uploads/plants/' . $newFileName;
                    }
                }
            }

            $query = "INSERT INTO plants 
                    (user_id, name, species, description, type, light_requirements, temperature_range,
                     humidity_requirements, watering_schedule, growth_rate, difficulty, care_instructions,
                     image_url, is_encyclopedia, created_at, updated_at)
                  VALUES 
                    (:user_id, :name, :species, :description, :type, :light_requirements, :temperature_range,
                     :humidity_requirements, :watering_schedule, :growth_rate, :difficulty, :care_instructions,
                     :image_url, 1, NOW(), NOW())";

            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id',               $admin_id);
            $stmt->bindParam(':name',                  $name);
            $stmt->bindParam(':species',               $species);
            $stmt->bindParam(':description',           $description);
            $stmt->bindParam(':type',                  $type);
            $stmt->bindParam(':light_requirements',    $light_requirements);
            $stmt->bindParam(':temperature_range',     $temperature_range);
            $stmt->bindParam(':humidity_requirements', $humidity_requirements);
            $stmt->bindParam(':watering_schedule',     $watering_schedule);
            $stmt->bindParam(':growth_rate',           $growth_rate);
            $stmt->bindParam(':difficulty',            $difficulty);
            $stmt->bindParam(':care_instructions',     $care_instructions);
            $stmt->bindParam(':image_url',             $main_image);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Plant created successfully',
                    'id' => $db->lastInsertId()
                ]);
            } else {
                $err = $stmt->errorInfo();
                throw new Exception('DB error: ' . $err[2]);
            }
        } catch (Exception $e) {
            error_log('Plant POST error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }

        $plant_id = isset($_GET['id']) ? $_GET['id'] : ($input['id'] ?? null);

        if (!$plant_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Plant ID required']);
            exit();
        }

        $fields = [];
        $params = [':id' => $plant_id];

        $allowedFields = [
            'common_name',
            'scientific_name',
            'family',
            'genus',
            'description',
            'care_instructions',
            'difficulty_level',
            'growth_rate',
            'max_height',
            'bloom_time',
            'is_indoor',
            'is_outdoor',
            'poisonous',
            'additional_info',
            'status'
        ];

        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $input[$field];
            }
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            exit();
        }

        $query = "UPDATE plants SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($query);

        if ($stmt->execute($params)) {
            echo json_encode(['success' => true, 'message' => 'Plant updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update plant']);
        }
        break;

    case 'DELETE':
        $plant_id = isset($_GET['id']) ? $_GET['id'] : null;

        if (!$plant_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Plant ID required']);
            exit();
        }

        $query = "DELETE FROM plants WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $plant_id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Plant deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete plant']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
