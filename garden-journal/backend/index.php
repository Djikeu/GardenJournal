<?php
// Load Composer autoloader
require_once __DIR__ . '/vendor/autoload.php';

// Simple health check
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

echo json_encode([
    'success' => true,
    'message' => 'Botanic Journal API is running',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>