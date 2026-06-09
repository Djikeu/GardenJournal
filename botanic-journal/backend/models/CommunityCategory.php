<?php
namespace BotanicJournal\Models;

use PDO;

class CommunityCategory {
    private $conn;
    private $table_name = "community_categories";

    public $id;
    public $name;
    public $description;
    public $icon;
    public $color;
    public $topic_count;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function readAll() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY name ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function incrementTopicCount($category_name) {
        $query = "UPDATE " . $this->table_name . " 
                 SET topic_count = topic_count + 1 
                 WHERE name = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $category_name);
        return $stmt->execute();
    }
}
?>