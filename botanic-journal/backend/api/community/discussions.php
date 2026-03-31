<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/CommunityDiscussion.php';

use BotanicJournal\Models\CommunityDiscussion;

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

$discussion = new CommunityDiscussion($db);
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
       
        if ($id) {
            $discussion->id = $id;
            $discussion_data = $discussion->readOneWithUser($user_id);
           
            if ($discussion_data) {
                $discussion->incrementViews();
                echo json_encode([
                    'success' => true,
                    'discussion' => $discussion_data
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Discussion not found'
                ]);
            }
        } else {
            $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
            $category = isset($_GET['category']) && $_GET['category'] !== 'All' && $_GET['category'] !== 'null' ? $_GET['category'] : null;
            $search = isset($_GET['search']) && $_GET['search'] !== '' ? $_GET['search'] : null;
           
            try {
                $discussions = $discussion->readAll($page, $limit, $category, $search);
                $total = $discussion->getTotalCount($category, $search);
               
                echo json_encode([
                    'success' => true,
                    'discussions' => $discussions,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => $total,
                        'pages' => ceil($total / $limit)
                    ]
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to fetch discussions: ' . $e->getMessage()
                ]);
            }
        }
        break;

    case 'POST':
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput, true);
       
        if (!isset($data['user_id']) || !isset($data['title']) || !isset($data['content'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'User ID, title and content are required'
            ]);
            exit();
        }
       
        $discussion->user_id = intval($data['user_id']);
        $discussion->title = trim($data['title']);
        $discussion->content = trim($data['content']);
        $discussion->category = isset($data['category']) ? $data['category'] : 'General';
       
        if($discussion_id = $discussion->create()) {
            $discussion->id = $discussion_id;
            $createdDiscussion = $discussion->readOne();
           
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Discussion created successfully',
                'discussion' => $createdDiscussion,
                'discussion_id' => $discussion_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create discussion'
            ]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
        break;
}
?>