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

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

require_once '../config/database.php';

function sendError($message, $code = 500)
{
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit();
}

function sendSuccess($data = null, $message = '', $code = 200)
{
    http_response_code($code);
    $response = [
        'success' => true,
        'message' => $message
    ];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    sendError('Database connection failed: ' . $e->getMessage());
}

// DYNAMIC USER ID HANDLING
$user_id = null;
$method = $_SERVER['REQUEST_METHOD'];

// Try to get user_id from GET parameters
if (isset($_GET['user_id'])) {
    $user_id = intval($_GET['user_id']);
} 
// Try to get user_id from POST/PUT/PATCH body
else if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
    $input = json_decode(file_get_contents("php://input"), true);
    if (isset($input['user_id'])) {
        $user_id = intval($input['user_id']);
    }
}

// Validate user_id
if (!$user_id || $user_id <= 0) {
    sendError('Valid user ID is required', 401);
}

// Log for debugging
error_log("🔑 Processing request for user_id: $user_id, method: $method");

if (isset($_GET['debug'])) {
    $debug_stmt = $db->prepare("
        SELECT id, name, user_id, is_encyclopedia, encyclopedia_id 
        FROM plants 
        WHERE user_id = :user_id
    ");
    $debug_stmt->bindParam(':user_id', $user_id);
    $debug_stmt->execute();
    $debug_plants = $debug_stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'debug_user_id' => $user_id,
        'all_plants_for_user' => $debug_plants,
        'user_plants_count' => count($debug_plants)
    ]);
    exit();
}

try {
    switch ($method) {
        case 'GET':
            handleGetRequest($db, $user_id);
            break;
        case 'POST':
            handlePostRequest($db, $user_id);
            break;
        case 'PUT':
            handlePutRequest($db, $user_id);
            break;
        case 'PATCH':
            handlePatchRequest($db, $user_id);
            break;
        case 'DELETE':
            handleDeleteRequest($db, $user_id);
            break;
        default:
            sendError('Method not allowed', 405);
            break;
    }
} catch (Exception $e) {
    sendError($e->getMessage());
}

// Add this function to automatically fix existing plants
function fixUserPlants($db, $user_id) {
    // Fix plants that were incorrectly marked as encyclopedia plants
    $fix_stmt = $db->prepare("
        UPDATE plants 
        SET is_encyclopedia = 0 
        WHERE user_id = :user_id AND encyclopedia_id IS NOT NULL AND is_encyclopedia = 1
    ");
    $fix_stmt->bindParam(':user_id', $user_id);
    $fix_stmt->execute();
    
    $fixed_count = $fix_stmt->rowCount();
    if ($fixed_count > 0) {
        error_log("🔄 Fixed $fixed_count plants for user $user_id (set is_encyclopedia = 0)");
    }
    
    return $fixed_count;
}

function handleGetRequest($db, $user_id)
{
    // Auto-fix user plants on every GET request
    $fixed_count = fixUserPlants($db, $user_id);
    
    if (isset($_GET['id'])) {
        // Get single plant
        $stmt = $db->prepare("SELECT * FROM plants WHERE id = :id AND user_id = :user_id");
        $stmt->bindParam(':id', $_GET['id']);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        $plant = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$plant) {
            sendError('Plant not found', 404);
        }

        sendSuccess($plant, 'Plant retrieved successfully');
    } else if (isset($_GET['encyclopedia'])) {
        // Get encyclopedia plants with added status
        $stmt = $db->prepare("
            SELECT p.*, 
                   (SELECT COUNT(*) FROM plants up 
                    WHERE up.encyclopedia_id = p.id AND up.user_id = :user_id 
                    AND up.is_encyclopedia = 0) as is_added
            FROM plants p 
            WHERE p.is_encyclopedia = 1 
            ORDER BY p.name
        ");
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        $plants = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendSuccess($plants, 'Encyclopedia plants retrieved successfully');
    } else {
        // Get user plants
        $stmt = $db->prepare("
            SELECT * FROM plants 
            WHERE user_id = :user_id 
            ORDER BY created_at DESC
        ");
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        $plants = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Debug log with more details
        error_log("👤 USER PLANTS - User ID: $user_id, Fixed: $fixed_count plants, Found: " . count($plants) . " total plants");
        foreach ($plants as $plant) {
            error_log("✅ USER - Plant ID: {$plant['id']}, Name: {$plant['name']}, is_encyclopedia: {$plant['is_encyclopedia']}, encyclopedia_id: " . ($plant['encyclopedia_id'] ?? 'NULL'));
        }

        sendSuccess($plants, 'User plants retrieved successfully');
    }
}

function handlePostRequest($db, $user_id) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON data', 400);
    }
    
    if (!isset($data['name']) || empty(trim($data['name']))) {
        sendError('Plant name is required', 400);
    }
    
    // Check if this is adding from encyclopedia
    $encyclopedia_id = isset($data['encyclopedia_id']) ? intval($data['encyclopedia_id']) : null;
    
    if ($encyclopedia_id) {
        // Get encyclopedia plant data to copy
        $encyclopedia_stmt = $db->prepare("SELECT * FROM plants WHERE id = :id AND is_encyclopedia = 1");
        $encyclopedia_stmt->bindParam(':id', $encyclopedia_id);
        $encyclopedia_stmt->execute();
        $encyclopedia_plant = $encyclopedia_stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$encyclopedia_plant) {
            sendError('Encyclopedia plant not found', 404);
        }
        
        // Count how many times this user has added this encyclopedia plant
        $count_stmt = $db->prepare("
            SELECT COUNT(*) as count FROM plants 
            WHERE user_id = :user_id AND encyclopedia_id = :encyclopedia_id
        ");
        $count_stmt->bindParam(':user_id', $user_id);
        $count_stmt->bindParam(':encyclopedia_id', $encyclopedia_id);
        $count_stmt->execute();
        $count_result = $count_stmt->fetch(PDO::FETCH_ASSOC);
        $plant_count = $count_result['count'];
        
        // Generate unique name if it's not the first one
        $plant_name = $encyclopedia_plant['name'];
        if ($plant_count > 0) {
            $plant_name = $encyclopedia_plant['name'] . ' ' . ($plant_count + 1);
        }
        
        // DEBUG: Log what we're inserting
        error_log("➕ ADDING PLANT - Name: $plant_name, User ID: $user_id, Encyclopedia ID: $encyclopedia_id");
        
        // Use encyclopedia plant data but set as USER PLANT (is_encyclopedia = 0)
        $stmt = $db->prepare("
            INSERT INTO plants 
            (user_id, name, species, type, description, light_requirements, watering_schedule, 
             image_url, status, is_favorite, is_encyclopedia, encyclopedia_id) 
            VALUES 
            (:user_id, :name, :species, :type, :description, :light_requirements, :watering_schedule,
             :image_url, :status, :is_favorite, :is_encyclopedia, :encyclopedia_id)
        ");
        
        $is_encyclopedia = 0; // FORCE this to be 0 for user plants
        
        $stmt->bindValue(':user_id', $user_id);
        $stmt->bindValue(':name', $plant_name);
        $stmt->bindValue(':species', $encyclopedia_plant['species']);
        $stmt->bindValue(':type', $encyclopedia_plant['type']);
        $stmt->bindValue(':description', $encyclopedia_plant['description']);
        $stmt->bindValue(':light_requirements', $encyclopedia_plant['light_requirements']);
        $stmt->bindValue(':watering_schedule', $encyclopedia_plant['watering_schedule']);
        $stmt->bindValue(':image_url', $encyclopedia_plant['image_url']);
        $stmt->bindValue(':status', 'healthy');
        $stmt->bindValue(':is_favorite', 0, PDO::PARAM_INT);
        $stmt->bindValue(':is_encyclopedia', $is_encyclopedia, PDO::PARAM_INT);
        $stmt->bindValue(':encyclopedia_id', $encyclopedia_id);
        
    } else {
        // Regular plant creation (not from encyclopedia)
        $stmt = $db->prepare("
            INSERT INTO plants 
            (user_id, name, species, type, description, light_requirements, watering_schedule, 
             image_url, status, is_favorite, is_encyclopedia) 
            VALUES 
            (:user_id, :name, :species, :type, :description, :light_requirements, :watering_schedule,
             :image_url, :status, :is_favorite, :is_encyclopedia)
        ");
        
        $name = trim($data['name']);
        $species = $data['species'] ?? '';
        $type = $data['type'] ?? 'indoor';
        $description = $data['description'] ?? '';
        $light_requirements = $data['light_requirements'] ?? 'medium';
        $watering_schedule = $data['watering_schedule'] ?? 'weekly';
        $image_url = $data['image_url'] ?? '';
        $status = $data['status'] ?? 'healthy';
        $is_favorite = $data['is_favorite'] ?? 0;
        $is_encyclopedia = 0; // User plants are not encyclopedia entries
        
        $stmt->bindValue(':user_id', $user_id);
        $stmt->bindValue(':name', $name);
        $stmt->bindValue(':species', $species);
        $stmt->bindValue(':type', $type);
        $stmt->bindValue(':description', $description);
        $stmt->bindValue(':light_requirements', $light_requirements);
        $stmt->bindValue(':watering_schedule', $watering_schedule);
        $stmt->bindValue(':image_url', $image_url);
        $stmt->bindValue(':status', $status);
        $stmt->bindValue(':is_favorite', $is_favorite, PDO::PARAM_INT);
        $stmt->bindValue(':is_encyclopedia', $is_encyclopedia, PDO::PARAM_INT);
    }
    
    if ($stmt->execute()) {
        $plant_id = $db->lastInsertId();
        
        // Get the created plant
        $plant_stmt = $db->prepare("SELECT * FROM plants WHERE id = :id");
        $plant_stmt->bindParam(':id', $plant_id);
        $plant_stmt->execute();
        $plant = $plant_stmt->fetch(PDO::FETCH_ASSOC);
        
        // Debug log
        error_log("🌱 PLANT CREATED - ID: $plant_id, Name: {$plant['name']}, is_encyclopedia: {$plant['is_encyclopedia']}, User ID: {$plant['user_id']}");
        
        sendSuccess($plant, 'Plant created successfully', 201);
    } else {
        $errorInfo = $stmt->errorInfo();
        throw new Exception('Database error: ' . $errorInfo[2]);
    }
}

function handlePutRequest($db, $user_id)
{
    $data = json_decode(file_get_contents("php://input"), true);
    $plant_id = $_GET['id'] ?? null;

    if (!$plant_id) {
        sendError('Plant ID is required', 400);
    }

    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON data', 400);
    }

    // Check if plant belongs to user
    $check_stmt = $db->prepare("SELECT id FROM plants WHERE id = :id AND user_id = :user_id");
    $check_stmt->bindParam(':id', $plant_id);
    $check_stmt->bindParam(':user_id', $user_id);
    $check_stmt->execute();

    if (!$check_stmt->fetch()) {
        sendError('Plant not found or access denied', 404);
    }

    // Build update query using your actual column names
    $fields = [
        'name',
        'species',
        'type',
        'description',
        'light_requirements',
        'watering_schedule',
        'image_url',
        'status',
        'humidity_requirements',
        'temperature_range'
    ];
    $updates = [];
    $params = [':id' => $plant_id];

    foreach ($fields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $data[$field];
        }
    }

    // Handle field aliases
    if (isset($data['light'])) {
        $updates[] = "light_requirements = :light";
        $params[":light"] = $data['light'];
    }

    if (empty($updates)) {
        sendError('No fields to update', 400);
    }

    $sql = "UPDATE plants SET " . implode(', ', $updates) . ", updated_at = CURRENT_TIMESTAMP WHERE id = :id";
    $stmt = $db->prepare($sql);

    if ($stmt->execute($params)) {
        sendSuccess(null, 'Plant updated successfully');
    } else {
        $errorInfo = $stmt->errorInfo();
        throw new Exception('Database error: ' . $errorInfo[2]);
    }
}

function handlePatchRequest($db, $user_id)
{
    $data = json_decode(file_get_contents("php://input"), true);
    $plant_id = $data['id'] ?? null;

    if (!$plant_id) {
        sendError('Plant ID is required', 400);
    }

    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON data', 400);
    }

    // Check if plant belongs to user
    $check_stmt = $db->prepare("SELECT id FROM plants WHERE id = :id AND user_id = :user_id");
    $check_stmt->bindParam(':id', $plant_id);
    $check_stmt->bindParam(':user_id', $user_id);
    $check_stmt->execute();

    if (!$check_stmt->fetch()) {
        sendError('Plant not found or access denied', 404);
    }

    // Handle favorite toggle
    if (isset($data['is_favorite'])) {
        $stmt = $db->prepare("UPDATE plants SET is_favorite = :is_favorite, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
        $is_favorite = $data['is_favorite'] ? 1 : 0;
        $stmt->bindParam(':is_favorite', $is_favorite, PDO::PARAM_INT);
        $stmt->bindParam(':id', $plant_id);

        if ($stmt->execute()) {
            sendSuccess(null, 'Plant favorite status updated successfully');
        } else {
            $errorInfo = $stmt->errorInfo();
            throw new Exception('Database error: ' . $errorInfo[2]);
        }
    } else {
        sendError('No valid fields to update', 400);
    }
}

function handleDeleteRequest($db, $user_id)
{
    $plant_id = $_GET['id'] ?? null;

    if (!$plant_id) {
        sendError('Plant ID is required', 400);
    }

    // Check if plant belongs to user
    $check_stmt = $db->prepare("SELECT id FROM plants WHERE id = :id AND user_id = :user_id");
    $check_stmt->bindParam(':id', $plant_id);
    $check_stmt->bindParam(':user_id', $user_id);
    $check_stmt->execute();

    if (!$check_stmt->fetch()) {
        sendError('Plant not found or access denied', 404);
    }

    $stmt = $db->prepare("DELETE FROM plants WHERE id = :id");
    $stmt->bindParam(':id', $plant_id);

    if ($stmt->execute()) {
        sendSuccess(null, 'Plant deleted successfully');
    } else {
        $errorInfo = $stmt->errorInfo();
        throw new Exception('Database error: ' . $errorInfo[2]);
    }
}
?>