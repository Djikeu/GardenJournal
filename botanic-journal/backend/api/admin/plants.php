<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Check if user is admin
$current_user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if (!$current_user_id) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit();
}

// Verify current user is admin
$check_admin_stmt = $db->prepare("SELECT role FROM users WHERE id = :id");
$check_admin_stmt->bindParam(':id', $current_user_id);
$check_admin_stmt->execute();
$user_role = $check_admin_stmt->fetchColumn();

if ($user_role !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin access required']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        handleGetPlants($db);
        break;
    case 'PUT':
    case 'PATCH':
        handleUpdatePlant($db);
        break;
    case 'DELETE':
        handleDeletePlant($db);
        break;
    case 'POST':
        handleCreatePlant($db);
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

function handleGetPlants($db) {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $offset = ($page - 1) * $limit;
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    
    // Get total count
    $count_sql = "SELECT COUNT(*) as total FROM plants";
    if ($search) {
        $count_sql .= " WHERE name LIKE :search OR species LIKE :search";
    }
    $count_stmt = $db->prepare($count_sql);
    if ($search) {
        $search_param = "%$search%";
        $count_stmt->bindParam(':search', $search_param);
    }
    $count_stmt->execute();
    $total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get plants with pagination
    $sql = "
        SELECT 
            p.*,
            u.name as owner_name,
            u.email as owner_email
        FROM plants p
        LEFT JOIN users u ON p.user_id = u.id
    ";
    
    if ($search) {
        $sql .= " WHERE p.name LIKE :search OR p.species LIKE :search";
    }
    
    $sql .= " ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($sql);
    if ($search) {
        $stmt->bindParam(':search', $search_param);
    }
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $plants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $plants,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function handleUpdatePlant($db) {
    $input = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Plant ID required']);
        exit();
    }
    
    $plant_id = intval($input['id']);
    
    // Allowed fields to update
    $allowed_fields = [
        'name', 'species', 'description', 'type', 
        'light_requirements', 'temperature_range', 'humidity_requirements',
        'watering_schedule', 'growth_rate', 'difficulty', 
        'care_instructions', 'image_url', 'status', 'is_favorite'
    ];
    
    $updates = [];
    $params = [':id' => $plant_id];
    
    foreach ($allowed_fields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $input[$field];
        }
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No valid fields to update']);
        exit();
    }
    
    $sql = "UPDATE plants SET " . implode(', ', $updates) . ", updated_at = CURRENT_TIMESTAMP WHERE id = :id";
    $stmt = $db->prepare($sql);
    
    if ($stmt->execute($params)) {
        // Get updated plant
        $get_stmt = $db->prepare("SELECT * FROM plants WHERE id = :id");
        $get_stmt->bindParam(':id', $plant_id);
        $get_stmt->execute();
        $updated_plant = $get_stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Plant updated successfully',
            'data' => $updated_plant
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update plant']);
    }
}

function handleDeletePlant($db) {
    $plant_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$plant_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Plant ID required']);
        exit();
    }
    
    // Check if plant exists
    $check_stmt = $db->prepare("SELECT id, name FROM plants WHERE id = :id");
    $check_stmt->bindParam(':id', $plant_id);
    $check_stmt->execute();
    $plant = $check_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$plant) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Plant not found']);
        exit();
    }
    
    // Delete plant (with cascade from foreign keys)
    $stmt = $db->prepare("DELETE FROM plants WHERE id = :id");
    $stmt->bindParam(':id', $plant_id);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true, 
            'message' => 'Plant "' . $plant['name'] . '" deleted successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete plant']);
    }
}

function handleCreatePlant($db) {
    $input = json_decode(file_get_contents("php://input"), true);
    
    // Required fields
    if (!isset($input['name']) || !isset($input['type'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Name and type are required']);
        exit();
    }
    
    $user_id = isset($input['user_id']) ? intval($input['user_id']) : 1;
    $name = $input['name'];
    $species = $input['species'] ?? null;
    $description = $input['description'] ?? null;
    $type = $input['type'];
    $light_requirements = $input['light_requirements'] ?? null;
    $temperature_range = $input['temperature_range'] ?? null;
    $humidity_requirements = $input['humidity_requirements'] ?? null;
    $watering_schedule = $input['watering_schedule'] ?? null;
    $growth_rate = $input['growth_rate'] ?? null;
    $difficulty = $input['difficulty'] ?? null;
    $care_instructions = $input['care_instructions'] ?? null;
    $image_url = $input['image_url'] ?? null;
    $status = $input['status'] ?? 'healthy';
    $is_favorite = isset($input['is_favorite']) ? $input['is_favorite'] : 0;
    
    $stmt = $db->prepare("
        INSERT INTO plants (user_id, name, species, description, type, light_requirements, 
        temperature_range, humidity_requirements, watering_schedule, growth_rate, difficulty, 
        care_instructions, image_url, status, is_favorite, created_at, updated_at)
        VALUES (:user_id, :name, :species, :description, :type, :light_requirements,
        :temperature_range, :humidity_requirements, :watering_schedule, :growth_rate, :difficulty,
        :care_instructions, :image_url, :status, :is_favorite, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ");
    
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':species', $species);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':type', $type);
    $stmt->bindParam(':light_requirements', $light_requirements);
    $stmt->bindParam(':temperature_range', $temperature_range);
    $stmt->bindParam(':humidity_requirements', $humidity_requirements);
    $stmt->bindParam(':watering_schedule', $watering_schedule);
    $stmt->bindParam(':growth_rate', $growth_rate);
    $stmt->bindParam(':difficulty', $difficulty);
    $stmt->bindParam(':care_instructions', $care_instructions);
    $stmt->bindParam(':image_url', $image_url);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':is_favorite', $is_favorite);
    
    if ($stmt->execute()) {
        $plant_id = $db->lastInsertId();
        
        // Get created plant
        $get_stmt = $db->prepare("SELECT * FROM plants WHERE id = :id");
        $get_stmt->bindParam(':id', $plant_id);
        $get_stmt->execute();
        $new_plant = $get_stmt->fetch(PDO::FETCH_ASSOC);
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Plant created successfully',
            'data' => $new_plant
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create plant']);
    }
}
?>