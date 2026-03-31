<?php
namespace BotanicJournal\Models;

use PDO;

class CommunityReply {
    private $conn;
    private $table_name = "community_replies";

    public $id;
    public $discussion_id;
    public $user_id;
    public $content;
    public $likes;
    public $created_at;
    public $updated_at;
    public $author_name;
    public $author_avatar;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create new reply
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                 (discussion_id, user_id, content)
                 VALUES
                 (:discussion_id, :user_id, :content)";
       
        $stmt = $this->conn->prepare($query);
       
        $stmt->bindParam(":discussion_id", $this->discussion_id);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":content", $this->content);
       
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Get all replies for a discussion with user interaction
    public function readByDiscussionWithUser($discussion_id, $page = 1, $limit = 20, $user_id = null) {
        $offset = ($page - 1) * $limit;
       
        $query = "SELECT r.*, u.name as author_name, u.avatar as author_avatar
                 FROM " . $this->table_name . " r
                 LEFT JOIN users u ON r.user_id = u.id
                 WHERE r.discussion_id = ?
                 ORDER BY r.created_at ASC
                 LIMIT ? OFFSET ?";
       
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $discussion_id, PDO::PARAM_INT);
        $stmt->bindParam(2, $limit, PDO::PARAM_INT);
        $stmt->bindParam(3, $offset, PDO::PARAM_INT);
       
        $stmt->execute();
        $replies = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($user_id && $replies) {
            foreach ($replies as &$reply) {
                $likeCheck = $this->conn->prepare("SELECT id FROM reply_likes WHERE reply_id = ? AND user_id = ?");
                $likeCheck->execute([$reply['id'], $user_id]);
                $reply['user_has_liked'] = $likeCheck->fetch() ? true : false;
            }
        }
        
        return $replies;
    }

    // Get all replies for a discussion
    public function readByDiscussion($discussion_id, $page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
       
        $query = "SELECT r.*, u.name as author_name, u.avatar as author_avatar
                 FROM " . $this->table_name . " r
                 LEFT JOIN users u ON r.user_id = u.id
                 WHERE r.discussion_id = ?
                 ORDER BY r.created_at ASC
                 LIMIT ? OFFSET ?";
       
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $discussion_id, PDO::PARAM_INT);
        $stmt->bindParam(2, $limit, PDO::PARAM_INT);
        $stmt->bindParam(3, $offset, PDO::PARAM_INT);
       
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Get total replies count
    public function getTotalCount($discussion_id) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . "
                 WHERE discussion_id = ?";
       
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $discussion_id, PDO::PARAM_INT);
        $stmt->execute();
       
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    // Read single reply
    public function readOne() {
        $query = "SELECT r.*, u.name as author_name, u.avatar as author_avatar
                 FROM " . $this->table_name . " r
                 LEFT JOIN users u ON r.user_id = u.id
                 WHERE r.id = ?";
       
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
       
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Like a reply
    public function like($reply_id, $user_id) {
        $check = $this->conn->prepare("SELECT id FROM reply_likes WHERE reply_id = ? AND user_id = ?");
        $check->execute([$reply_id, $user_id]);
        
        if ($check->fetch()) {
            return false;
        }
        
        $query = "INSERT INTO reply_likes (reply_id, user_id) VALUES (?, ?)";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute([$reply_id, $user_id])) {
            $update = $this->conn->prepare("UPDATE community_replies SET likes = (SELECT COUNT(*) FROM reply_likes WHERE reply_id = ?) WHERE id = ?");
            $update->execute([$reply_id, $reply_id]);
            return true;
        }
        
        return false;
    }

    // Unlike a reply
    public function unlike($reply_id, $user_id) {
        $query = "DELETE FROM reply_likes WHERE reply_id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute([$reply_id, $user_id])) {
            $update = $this->conn->prepare("UPDATE community_replies SET likes = (SELECT COUNT(*) FROM reply_likes WHERE reply_id = ?) WHERE id = ?");
            $update->execute([$reply_id, $reply_id]);
            return true;
        }
        
        return false;
    }
}
?>