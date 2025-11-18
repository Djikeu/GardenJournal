<?php
namespace BotanicJournal;

class Journal {
    private $conn;
    private $table = 'journals';

    public $id;
    public $user_id;
    public $plant_id;
    public $title;
    public $content;
    public $images;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT j.*, p.name as plant_name 
                 FROM " . $this->table . " j 
                 LEFT JOIN plants p ON j.plant_id = p.id 
                 WHERE j.user_id = :user_id 
                 ORDER BY j.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                 SET user_id=:user_id, plant_id=:plant_id, title=:title, 
                     content=:content, images=:images";

        $stmt = $this->conn->prepare($query);

        // Clean data
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->content = htmlspecialchars(strip_tags($this->content));

        // Bind data
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':plant_id', $this->plant_id);
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':content', $this->content);
        $stmt->bindParam(':images', $this->images);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }
}
?>