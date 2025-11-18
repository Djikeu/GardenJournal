<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'botanic_journal';
    private $username = 'root';  // XAMPP default username
    private $password = '';      // XAMPP default password (empty)
    public $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]
            );
        } catch(PDOException $exception) {
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed: ' . $exception->getMessage()
            ]);
            exit();
        }
        
        return $this->conn;
    }
}
?>