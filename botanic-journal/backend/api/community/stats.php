<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';


$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        try {
            // Get total discussions count
            $discussionsQuery = "SELECT COUNT(*) as total FROM community_discussions";
            $discussionsStmt = $db->prepare($discussionsQuery);
            $discussionsStmt->execute();
            $totalDiscussions = $discussionsStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get total replies count
            $repliesQuery = "SELECT COUNT(*) as total FROM community_replies";
            $repliesStmt = $db->prepare($repliesQuery);
            $repliesStmt->execute();
            $totalReplies = $repliesStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get active users (users who have posted in last 7 days)
            $activeUsersQuery = "SELECT COUNT(DISTINCT user_id) as total FROM (
                SELECT user_id FROM community_discussions 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                UNION
                SELECT user_id FROM community_replies
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ) as active_users";
            $activeUsersStmt = $db->prepare($activeUsersQuery);
            $activeUsersStmt->execute();
            $activeUsers = $activeUsersStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get today's discussions
            $todayDiscussionsQuery = "SELECT COUNT(*) as total FROM community_discussions 
                                      WHERE DATE(created_at) = CURDATE()";
            $todayStmt = $db->prepare($todayDiscussionsQuery);
            $todayStmt->execute();
            $todayDiscussions = $todayStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            echo json_encode([
                'success' => true,
                'stats' => [
                    'totalDiscussions' => (int)$totalDiscussions,
                    'totalReplies' => (int)$totalReplies,
                    'activeUsers' => (int)$activeUsers,
                    'todayDiscussions' => (int)$todayDiscussions
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch stats: ' . $e->getMessage()
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