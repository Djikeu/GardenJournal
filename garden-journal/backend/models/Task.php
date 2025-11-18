<?php
namespace BotanicJournal;

class Task {
    private $conn;
    private $table = 'tasks';

    public $id;
    public $user_id;
    public $plant_id;
    public $title;
    public $description;
    public $priority;
    public $due_date;
    public $completed;
    public $progress;
    public $type;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT t.*, p.name as plant_name 
                 FROM " . $this->table . " t 
                 LEFT JOIN plants p ON t.plant_id = p.id 
                 WHERE t.user_id = :user_id 
                 ORDER BY t.priority DESC, t.due_date ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->execute();
        return $stmt;
    }

    public function complete() {
        $query = "UPDATE " . $this->table . " 
                 SET completed = 1, progress = 100 
                 WHERE id = :id AND user_id = :user_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->bindParam(':user_id', $this->user_id);

        return $stmt->execute();
    }
}
?>