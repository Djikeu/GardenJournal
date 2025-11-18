<?php
namespace BotanicJournal;

class Plant {
    private $conn;
    private $table = 'plants';

    public $id;
    public $user_id;
    public $name;
    public $species;
    public $type;
    public $image;
    public $status;
    public $last_watered;
    public $temperature;
    public $light;
    public $humidity;
    public $is_favorite;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT * FROM " . $this->table . " WHERE user_id = :user_id ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                 SET user_id=:user_id, name=:name, species=:species, type=:type, 
                     image=:image, status=:status, last_watered=:last_watered,
                     temperature=:temperature, light=:light, humidity=:humidity, 
                     is_favorite=:is_favorite";

        $stmt = $this->conn->prepare($query);

        // Clean data
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->species = htmlspecialchars(strip_tags($this->species));

        // Bind data
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':species', $this->species);
        $stmt->bindParam(':type', $this->type);
        $stmt->bindParam(':image', $this->image);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':last_watered', $this->last_watered);
        $stmt->bindParam(':temperature', $this->temperature);
        $stmt->bindParam(':light', $this->light);
        $stmt->bindParam(':humidity', $this->humidity);
        $stmt->bindParam(':is_favorite', $this->is_favorite);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function updateFavorite() {
        $query = "UPDATE " . $this->table . " 
                 SET is_favorite = :is_favorite 
                 WHERE id = :id AND user_id = :user_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':is_favorite', $this->is_favorite);
        $stmt->bindParam(':id', $this->id);
        $stmt->bindParam(':user_id', $this->user_id);

        return $stmt->execute();
    }
}
?>