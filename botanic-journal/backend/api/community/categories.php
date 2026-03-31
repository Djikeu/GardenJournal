<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/CommunityCategory.php';

use BotanicJournal\Models\CommunityCategory;

$database = new Database();
$db = $database->getConnection();
$category = new CommunityCategory($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        try {
            $categories = $category->readAll();
            echo json_encode([
                'success' => true,
                'categories' => $categories
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch categories: ' . $e->getMessage()
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