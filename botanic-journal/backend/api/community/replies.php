<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/CommunityDiscussion.php';
require_once '../../models/CommunityReply.php';

use BotanicJournal\Models\CommunityDiscussion;
use BotanicJournal\Models\CommunityReply;

$database = new Database();
$db = $database->getConnection();
$reply = new CommunityReply($db);
$discussion = new CommunityDiscussion($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $discussion_id = isset($_GET['discussion_id']) ? intval($_GET['discussion_id']) : null;
        $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
       
        if (!$discussion_id) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Discussion ID is required'
            ]);
            exit();
        }
       
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
       
        try {
            $replies = $reply->readByDiscussionWithUser($discussion_id, $page, $limit, $user_id);
            $total = $reply->getTotalCount($discussion_id);
           
            echo json_encode([
                'success' => true,
                'replies' => $replies,
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
                'message' => 'Failed to fetch replies: ' . $e->getMessage()
            ]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
       
        if (!isset($data['discussion_id']) || !isset($data['user_id']) || !isset($data['content'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Discussion ID, user ID and content are required'
            ]);
            exit();
        }
       
        $reply->discussion_id = $data['discussion_id'];
        $reply->user_id = $data['user_id'];
        $reply->content = $data['content'];
       
        if($reply_id = $reply->create()) {
            $discussion->id = $data['discussion_id'];
            $discussion->updateReplyCount();
           
            $reply->id = $reply_id;
            $reply_data = $reply->readOne();
           
            echo json_encode([
                'success' => true,
                'message' => 'Reply posted successfully',
                'reply' => $reply_data
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to post reply'
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