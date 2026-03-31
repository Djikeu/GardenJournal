<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/CommunityDiscussion.php';
require_once '../../models/CommunityReply.php';

use BotanicJournal\Models\CommunityDiscussion;
use BotanicJournal\Models\CommunityReply;

$database = new Database();
$db = $database->getConnection();
$discussion = new CommunityDiscussion($db);
$reply = new CommunityReply($db);

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

switch($method) {
    case 'POST':
        if (isset($data['discussion_id']) && isset($data['user_id'])) {
            $discussion->id = $data['discussion_id'];
            $result = $discussion->like($data['user_id']);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Discussion liked']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Already liked or failed']);
            }
        } 
        elseif (isset($data['reply_id']) && isset($data['user_id'])) {
            $result = $reply->like($data['reply_id'], $data['user_id']);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Reply liked']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Already liked or failed']);
            }
        }
        else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Discussion ID or Reply ID and user ID required']);
        }
        break;
        
    case 'DELETE':
        $discussion_id = isset($_GET['discussion_id']) ? intval($_GET['discussion_id']) : null;
        $reply_id = isset($_GET['reply_id']) ? intval($_GET['reply_id']) : null;
        $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
        
        if (!$user_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID required']);
            exit();
        }
        
        if ($discussion_id) {
            $discussion->id = $discussion_id;
            $result = $discussion->unlike($user_id);
            echo json_encode(['success' => $result, 'message' => $result ? 'Discussion unliked' : 'Failed to unlike']);
        } 
        elseif ($reply_id) {
            $result = $reply->unlike($reply_id, $user_id);
            echo json_encode(['success' => $result, 'message' => $result ? 'Reply unliked' : 'Failed to unlike']);
        }
        else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Discussion ID or Reply ID required']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>