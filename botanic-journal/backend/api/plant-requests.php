<?php
// api/plant-request.php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
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

function getCurrentUser($db)
{
    $headers = getallheaders();
    
    session_start();
    if (isset($_SESSION['user_id'])) {
        $stmt = $db->prepare("SELECT id, name, email, role FROM users WHERE id = :id");
        $stmt->bindParam(':id', $_SESSION['user_id']);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (isset($headers['X-User-Id'])) {
        $user_id = intval($headers['X-User-Id']);
        $stmt = $db->prepare("SELECT id, name, email, role FROM users WHERE id = :id");
        $stmt->bindParam(':id', $user_id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (isset($_GET['user_id']) && intval($_GET['user_id']) > 0) {
        $user_id = intval($_GET['user_id']);
        $stmt = $db->prepare("SELECT id, name, email, role FROM users WHERE id = :id");
        $stmt->bindParam(':id', $user_id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    return null;
}

function isAdmin($user)
{
    return $user && isset($user['role']) && $user['role'] === 'admin';
}

$current_user = getCurrentUser($db);
$user_id = $current_user ? $current_user['id'] : null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$request_id = isset($_GET['id']) ? intval($_GET['id']) : null;

switch ($method) {
    case 'POST':
        try {
            $common_name = $_POST['common_name'] ?? '';
            $scientific_name = $_POST['scientific_name'] ?? '';
            $family = $_POST['family'] ?? null;
            $genus = $_POST['genus'] ?? null;
            $description = $_POST['description'] ?? null;
            $care_instructions = $_POST['care_instructions'] ?? null;
            $difficulty_level = $_POST['difficulty_level'] ?? 'beginner';
            $growth_rate = $_POST['growth_rate'] ?? 'medium';
            $max_height = $_POST['max_height'] ?? null;
            $bloom_time = $_POST['bloom_time'] ?? null;
            $is_indoor = isset($_POST['is_indoor']) ? filter_var($_POST['is_indoor'], FILTER_VALIDATE_BOOLEAN) : true;
            $is_outdoor = isset($_POST['is_outdoor']) ? filter_var($_POST['is_outdoor'], FILTER_VALIDATE_BOOLEAN) : false;
            $poisonous = isset($_POST['poisonous']) ? filter_var($_POST['poisonous'], FILTER_VALIDATE_BOOLEAN) : false;
            $additional_info = $_POST['additional_info'] ?? null;

            if (empty($common_name) || empty($scientific_name)) {
                throw new Exception('Common name and scientific name are required');
            }

            $uploaded_images = [];
            $upload_dir = '../uploads/plant_requests/';

            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0755, true);
            }

            if (isset($_FILES['images'])) {
                $files = $_FILES['images'];
                if (is_array($files['name'])) {
                    $file_count = count($files['name']);
                    for ($i = 0; $i < $file_count; $i++) {
                        if ($files['error'][$i] === UPLOAD_ERR_OK) {
                            $file_tmp = $files['tmp_name'][$i];
                            $file_name = $files['name'][$i];
                            $file_extension = pathinfo($file_name, PATHINFO_EXTENSION);
                            $new_filename = 'plant_' . time() . '_' . uniqid() . '.' . $file_extension;
                            $file_path = $upload_dir . $new_filename;

                            if (move_uploaded_file($file_tmp, $file_path)) {
                                $uploaded_images[] = '/uploads/plant_requests/' . $new_filename;
                            }
                        }
                    }
                } else {
                    if ($files['error'] === UPLOAD_ERR_OK) {
                        $file_tmp = $files['tmp_name'];
                        $file_name = $files['name'];
                        $file_extension = pathinfo($file_name, PATHINFO_EXTENSION);
                        $new_filename = 'plant_' . time() . '_' . uniqid() . '.' . $file_extension;
                        $file_path = $upload_dir . $new_filename;

                        if (move_uploaded_file($file_tmp, $file_path)) {
                            $uploaded_images[] = '/uploads/plant_requests/' . $new_filename;
                        }
                    }
                }
            }

            $care_json = null;
            if ($care_instructions) {
                if (is_string($care_instructions)) {
                    json_decode($care_instructions);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $care_json = $care_instructions;
                    } else {
                        $care_json = json_encode($care_instructions);
                    }
                } else {
                    $care_json = json_encode($care_instructions);
                }
            }

            $images_json = !empty($uploaded_images) ? json_encode($uploaded_images) : null;

            $query = "INSERT INTO plant_requests (
                common_name, scientific_name, family, genus, description, 
                care_instructions, difficulty_level, growth_rate, max_height, 
                bloom_time, is_indoor, is_outdoor, poisonous, additional_info, 
                images, status, submitted_by
            ) VALUES (
                :common_name, :scientific_name, :family, :genus, :description,
                :care_instructions, :difficulty_level, :growth_rate, :max_height,
                :bloom_time, :is_indoor, :is_outdoor, :poisonous, :additional_info,
                :images, 'pending', :submitted_by
            )";

            $stmt = $db->prepare($query);
            $stmt->bindParam(':common_name', $common_name);
            $stmt->bindParam(':scientific_name', $scientific_name);
            $stmt->bindParam(':family', $family);
            $stmt->bindParam(':genus', $genus);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':care_instructions', $care_json);
            $stmt->bindParam(':difficulty_level', $difficulty_level);
            $stmt->bindParam(':growth_rate', $growth_rate);
            $stmt->bindParam(':max_height', $max_height);
            $stmt->bindParam(':bloom_time', $bloom_time);
            $stmt->bindParam(':is_indoor', $is_indoor, PDO::PARAM_BOOL);
            $stmt->bindParam(':is_outdoor', $is_outdoor, PDO::PARAM_BOOL);
            $stmt->bindParam(':poisonous', $poisonous, PDO::PARAM_BOOL);
            $stmt->bindParam(':additional_info', $additional_info);
            $stmt->bindParam(':images', $images_json);
            $stmt->bindParam(':submitted_by', $user_id);

            if ($stmt->execute()) {
                $new_request_id = $db->lastInsertId();

                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Plant request submitted successfully',
                    'data' => ['id' => $new_request_id]
                ]);
            } else {
                throw new Exception('Failed to submit request');
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;

    case 'GET':
        try {
            $filter = isset($_GET['filter']) ? $_GET['filter'] : 'all';
            $my_requests = isset($_GET['my_requests']) ? true : false;
            
            $is_admin = isAdmin($current_user);

            $query = "SELECT pr.*, u.name as submitter_name, u.email as submitter_email 
                      FROM plant_requests pr 
                      LEFT JOIN users u ON pr.submitted_by = u.id";

            $conditions = [];
            $params = [];

            if ($my_requests || !$is_admin) {
                $conditions[] = "pr.submitted_by = :user_id";
                $params[':user_id'] = $user_id;
            }

            if ($filter !== 'all') {
                $conditions[] = "pr.status = :filter";
                $params[':filter'] = $filter;
            }

            if (!empty($conditions)) {
                $query .= " WHERE " . implode(" AND ", $conditions);
            }

            $query .= " ORDER BY pr.created_at DESC";

            $stmt = $db->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }

            $stmt->execute();
            $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($requests as &$request) {
                if ($request['care_instructions']) {
                    $request['care_instructions'] = json_decode($request['care_instructions'], true);
                }
                if ($request['images']) {
                    $request['images'] = json_decode($request['images'], true);
                }
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $requests
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;

    case 'PUT':
    case 'PATCH':
        if (!$request_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Request ID is required']);
            exit();
        }

        if (!isAdmin($current_user)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Admin access required']);
            exit();
        }

        try {
            $data = json_decode(file_get_contents("php://input"), true);
            $status = $data['status'] ?? null;
            $admin_notes = $data['admin_notes'] ?? null;

            if (!$status || !in_array($status, ['approved', 'rejected'])) {
                throw new Exception('Valid status (approved/rejected) is required');
            }

            $db->beginTransaction();

            // Get the request data
            $get_query = "SELECT * FROM plant_requests WHERE id = :id";
            $get_stmt = $db->prepare($get_query);
            $get_stmt->bindParam(':id', $request_id);
            $get_stmt->execute();
            $request = $get_stmt->fetch(PDO::FETCH_ASSOC);

            if (!$request) {
                throw new Exception('Request not found');
            }

            $new_plant_id = null;

            // If approved, add to plants table
            if ($status === 'approved') {
                // Get first image URL
                $images = json_decode($request['images'], true);
                $first_image = $images ? $images[0] : null;
                
                // Decode care instructions
                $care_instructions = $request['care_instructions'];
                if (is_string($care_instructions)) {
                    $decoded = json_decode($care_instructions, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $care_instructions = $decoded;
                    }
                }
                
                // Convert care instructions to readable text
                $care_text = '';
                if (is_array($care_instructions)) {
                    if (!empty($care_instructions['watering'])) {
                        $care_text .= "💧 Watering: " . $care_instructions['watering'] . "\n\n";
                    }
                    if (!empty($care_instructions['sunlight'])) {
                        $care_text .= "☀️ Sunlight: " . $care_instructions['sunlight'] . "\n\n";
                    }
                    if (!empty($care_instructions['temperature'])) {
                        $care_text .= "🌡️ Temperature: " . $care_instructions['temperature'] . "\n\n";
                    }
                    if (!empty($care_instructions['humidity'])) {
                        $care_text .= "💨 Humidity: " . $care_instructions['humidity'] . "\n\n";
                    }
                    if (!empty($care_instructions['soil'])) {
                        $care_text .= "🪴 Soil: " . $care_instructions['soil'] . "\n\n";
                    }
                    if (!empty($care_instructions['fertilizer'])) {
                        $care_text .= "🌿 Fertilizer: " . $care_instructions['fertilizer'] . "\n\n";
                    }
                } elseif ($care_instructions) {
                    $care_text = $care_instructions;
                }
                
                // Add additional info if exists
                if ($request['additional_info']) {
                    $care_text .= "\n📝 Additional Info: " . $request['additional_info'];
                }
                
                // Add max height and bloom time if exists
                $description_text = $request['description'] ?? '';
                if ($request['max_height']) {
                    $description_text .= "\n\n📏 Max Height: " . $request['max_height'];
                }
                if ($request['bloom_time']) {
                    $description_text .= "\n🌸 Bloom Time: " . $request['bloom_time'];
                }
                if ($request['family']) {
                    $description_text .= "\n🌱 Family: " . $request['family'];
                }
                if ($request['genus']) {
                    $description_text .= "\n🔬 Genus: " . $request['genus'];
                }
                
                // Map difficulty level
                $difficulty_map = [
                    'beginner' => 'Easy',
                    'intermediate' => 'Moderate',
                    'advanced' => 'Advanced'
                ];
                $difficulty = $difficulty_map[$request['difficulty_level']] ?? 'Easy';
                
                // Map growth rate
                $growth_rate_map = [
                    'slow' => 'Slow',
                    'medium' => 'Moderate',
                    'fast' => 'Fast'
                ];
                $growth_rate = $growth_rate_map[$request['growth_rate']] ?? 'Moderate';
                
                // Determine plant type
                $plant_type = 'indoor';
                if ($request['is_outdoor'] && !$request['is_indoor']) {
                    $plant_type = 'outdoor';
                } elseif ($request['is_indoor'] && $request['is_outdoor']) {
                    $plant_type = 'indoor';
                } elseif (!$request['is_indoor'] && !$request['is_outdoor']) {
                    $plant_type = 'indoor';
                }
                
                // Insert into plants table
                $insert_query = "INSERT INTO plants (
                    user_id,
                    name, 
                    species,
                    description, 
                    type,
                    care_instructions,
                    growth_rate,
                    difficulty,
                    image_url,
                    is_encyclopedia,
                    status,
                    created_at,
                    updated_at
                ) VALUES (
                    :user_id,
                    :name,
                    :species,
                    :description,
                    :type,
                    :care_instructions,
                    :growth_rate,
                    :difficulty,
                    :image_url,
                    1,
                    'healthy',
                    NOW(),
                    NOW()
                )";
                
                $insert_stmt = $db->prepare($insert_query);
                
                $insert_stmt->bindParam(':user_id', $request['submitted_by']);
                $insert_stmt->bindParam(':name', $request['common_name']);
                $insert_stmt->bindParam(':species', $request['scientific_name']);
                $insert_stmt->bindParam(':description', $description_text);
                $insert_stmt->bindParam(':type', $plant_type);
                $insert_stmt->bindParam(':care_instructions', $care_text);
                $insert_stmt->bindParam(':growth_rate', $growth_rate);
                $insert_stmt->bindParam(':difficulty', $difficulty);
                $insert_stmt->bindParam(':image_url', $first_image);
                
                if (!$insert_stmt->execute()) {
                    throw new Exception('Failed to add plant to encyclopedia: ' . json_encode($insert_stmt->errorInfo()));
                }
                
                $new_plant_id = $db->lastInsertId();
            }

            // Update the request status
            $update_query = "UPDATE plant_requests SET status = :status, admin_notes = :admin_notes, updated_at = NOW() WHERE id = :id";
            $update_stmt = $db->prepare($update_query);
            $update_stmt->bindParam(':status', $status);
            $update_stmt->bindParam(':admin_notes', $admin_notes);
            $update_stmt->bindParam(':id', $request_id);
            $update_stmt->execute();

            $db->commit();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => $status === 'approved' ? 'Plant request approved and added to encyclopedia' : 'Plant request rejected',
                'data' => $status === 'approved' ? ['plant_id' => $new_plant_id] : null
            ]);
        } catch (Exception $e) {
            $db->rollBack();
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