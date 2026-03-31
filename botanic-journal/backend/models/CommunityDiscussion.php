<?php

namespace BotanicJournal\Models;

use PDO;
use PDOException;

class CommunityDiscussion
{
    private $conn;
    private $table_name = "community_discussions";

    public $id;
    public $user_id;
    public $title;
    public $content;
    public $category;
    public $views;
    public $reply_count;
    public $likes;
    public $is_pinned;
    public $created_at;
    public $updated_at;
    public $author_name;
    public $author_avatar;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Create new discussion
    public function create()
    {
        if (empty($this->user_id) || empty($this->title) || empty($this->content)) {
            error_log("Missing required fields: user_id={$this->user_id}, title={$this->title}");
            return false;
        }
        
        $checkUser = $this->conn->prepare("SELECT id FROM users WHERE id = ?");
        $checkUser->execute([$this->user_id]);
        if (!$checkUser->fetch()) {
            error_log("User ID {$this->user_id} does not exist");
            return false;
        }
        
        $query = "INSERT INTO " . $this->table_name . "
             (user_id, title, content, category)
             VALUES
             (:user_id, :title, :content, :category)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":content", $this->content);
        $stmt->bindParam(":category", $this->category);
        
        try {
            if ($stmt->execute()) {
                $lastId = $this->conn->lastInsertId();
                error_log("Insert successful. Last insert ID: " . $lastId);
                return $lastId;
            } else {
                $errorInfo = $stmt->errorInfo();
                error_log("Execute failed. Error info: " . print_r($errorInfo, true));
                return false;
            }
        } catch (PDOException $e) {
            error_log("PDOException in create(): " . $e->getMessage());
            return false;
        }
    }

    // Read discussions with filters
    public function readAll($page = 1, $limit = 10, $category = null, $search = null)
    {
        $offset = ($page - 1) * $limit;

        $query = "SELECT d.*, u.name as author_name, u.avatar as author_avatar
                 FROM " . $this->table_name . " d
                 LEFT JOIN users u ON d.user_id = u.id
                 WHERE 1=1";

        $params = [];

        if ($category && $category !== 'All') {
            $query .= " AND d.category = ?";
            $params[] = $category;
        }

        if ($search) {
            $query .= " AND (d.title LIKE ? OR d.content LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $query .= " ORDER BY d.is_pinned DESC, d.created_at DESC
                   LIMIT ? OFFSET ?";

        $params[] = $limit;
        $params[] = $offset;

        $stmt = $this->conn->prepare($query);

        foreach ($params as $index => $param) {
            $stmt->bindValue($index + 1, $param, is_int($param) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Get total count
    public function getTotalCount($category = null, $search = null)
    {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE 1=1";
        $params = [];

        if ($category && $category !== 'All') {
            $query .= " AND category = ?";
            $params[] = $category;
        }

        if ($search) {
            $query .= " AND (title LIKE ? OR content LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $stmt = $this->conn->prepare($query);

        foreach ($params as $index => $param) {
            $stmt->bindValue($index + 1, $param, PDO::PARAM_STR);
        }

        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    // Read single discussion with user interaction
    public function readOneWithUser($user_id = null)
    {
        $query = "SELECT d.*, u.name as author_name, u.avatar as author_avatar
                 FROM " . $this->table_name . " d
                 LEFT JOIN users u ON d.user_id = u.id
                 WHERE d.id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
        
        $discussion = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($discussion && $user_id) {
            $likeCheck = $this->conn->prepare("SELECT id FROM discussion_likes WHERE discussion_id = ? AND user_id = ?");
            $likeCheck->execute([$this->id, $user_id]);
            $discussion['user_has_liked'] = $likeCheck->fetch() ? true : false;
        }
        
        return $discussion;
    }

    // Read single discussion
    public function readOne()
    {
        $query = "SELECT d.*, u.name as author_name, u.avatar as author_avatar
                 FROM " . $this->table_name . " d
                 LEFT JOIN users u ON d.user_id = u.id
                 WHERE d.id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Update view count
    public function incrementViews()
    {
        $query = "UPDATE " . $this->table_name . "
                 SET views = views + 1
                 WHERE id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        return $stmt->execute();
    }

    // Update reply count
    public function updateReplyCount()
    {
        $query = "UPDATE " . $this->table_name . " d
                 SET d.reply_count = (
                     SELECT COUNT(*)
                     FROM community_replies r
                     WHERE r.discussion_id = d.id
                 ),
                 d.updated_at = CURRENT_TIMESTAMP
                 WHERE d.id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        return $stmt->execute();
    }

    // Like a discussion
    public function like($user_id)
    {
        $check = $this->conn->prepare("SELECT id FROM discussion_likes WHERE discussion_id = ? AND user_id = ?");
        $check->execute([$this->id, $user_id]);
        
        if ($check->fetch()) {
            return false;
        }
        
        $query = "INSERT INTO discussion_likes (discussion_id, user_id) VALUES (?, ?)";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute([$this->id, $user_id])) {
            $update = $this->conn->prepare("UPDATE " . $this->table_name . " SET likes = (SELECT COUNT(*) FROM discussion_likes WHERE discussion_id = ?) WHERE id = ?");
            $update->execute([$this->id, $this->id]);
            return true;
        }
        
        return false;
    }

    // Unlike a discussion
    public function unlike($user_id)
    {
        $query = "DELETE FROM discussion_likes WHERE discussion_id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute([$this->id, $user_id])) {
            $update = $this->conn->prepare("UPDATE " . $this->table_name . " SET likes = (SELECT COUNT(*) FROM discussion_likes WHERE discussion_id = ?) WHERE id = ?");
            $update->execute([$this->id, $this->id]);
            return true;
        }
        
        return false;
    }
}