<?php
namespace BotanicJournal;

use PDO;

class Journal {
    private $conn;
    private $table_name = "journals";

    public $id;
    public $user_id;
    public $plant_id;
    public $title;
    public $content;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create a new journal entry
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                 (user_id, plant_id, title, content) 
                 VALUES 
                 (:user_id, :plant_id, :title, :content)";
        
        $stmt = $this->conn->prepare($query);
        
        // Bind parameters
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":plant_id", $this->plant_id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":content", $this->content);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Read all journal entries for a user
    public function read() {
        $query = "SELECT j.*, p.name as plant_name 
                 FROM " . $this->table_name . " j 
                 LEFT JOIN plants p ON j.plant_id = p.id 
                 WHERE j.user_id = :user_id 
                 ORDER BY j.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->execute();
        
        return $stmt;
    }

    // Read single journal entry
    public function readOne() {
        $query = "SELECT j.*, p.name as plant_name 
                 FROM " . $this->table_name . " j 
                 LEFT JOIN plants p ON j.plant_id = p.id 
                 WHERE j.id = :id AND j.user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->execute();
        
        return $stmt;
    }

    // Update journal entry
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                 SET 
                     plant_id = :plant_id,
                     title = :title,
                     content = :content
                 WHERE 
                     id = :id AND user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);
        
        // Bind parameters
        $stmt->bindParam(":plant_id", $this->plant_id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":content", $this->content);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);
        
        return $stmt->execute();
    }

    // Delete journal entry
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " 
                 WHERE id = :id AND user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);
        
        return $stmt->execute();
    }
}
?>