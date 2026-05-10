<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get user ID from request
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 1;

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    try {
        // Get user's plant count
        $plant_stmt = $db->prepare("SELECT COUNT(*) as total_plants FROM plants WHERE user_id = :user_id");
        $plant_stmt->bindParam(':user_id', $user_id);
        $plant_stmt->execute();
        $plant_count = $plant_stmt->fetch(PDO::FETCH_ASSOC)['total_plants'];

        // Get user's pending tasks count
        $task_stmt = $db->prepare("SELECT COUNT(*) as pending_tasks FROM tasks WHERE user_id = :user_id AND completed = 0");
        $task_stmt->bindParam(':user_id', $user_id);
        $task_stmt->execute();
        $pending_tasks = $task_stmt->fetch(PDO::FETCH_ASSOC)['pending_tasks'];

        // Get completion rate
        $completion_stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_tasks
            FROM tasks 
            WHERE user_id = :user_id
        ");
        $completion_stmt->bindParam(':user_id', $user_id);
        $completion_stmt->execute();
        $completion_data = $completion_stmt->fetch(PDO::FETCH_ASSOC);
        
        $completion_rate = 0;
        if ($completion_data['total_tasks'] > 0) {
            $completion_rate = round(($completion_data['completed_tasks'] / $completion_data['total_tasks']) * 100);
        }

        // Get recent activity (last 10 activities)
        // Combines: completed tasks, added plants, journal entries
        $activity_stmt = $db->prepare("
            SELECT
                'task_completed' as type,
                'fas fa-check-circle' as icon,
                CONCAT('Completed task: ', title) as title,
                updated_at as time
            FROM tasks
            WHERE user_id = :user_id AND completed = 1
            UNION ALL
            SELECT
                'plant_added' as type,
                'fas fa-seedling' as icon,
                CONCAT('Added plant: ', name) as title,
                created_at as time
            FROM plants
            WHERE user_id = :user_id
            UNION ALL
            SELECT
                'journal' as type,
                'fas fa-book' as icon,
                CONCAT('Journal entry: ', COALESCE(NULLIF(title, ''), 'Untitled')) as title,
                created_at as time
            FROM journals
            WHERE user_id = :user_id
            ORDER BY time DESC
            LIMIT 10
        ");
        $activity_stmt->bindParam(':user_id', $user_id);
        $activity_stmt->execute();
        $recent_activity = $activity_stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format activity times
        foreach ($recent_activity as &$activity) {
            if (empty($activity['time'])) {
                $activity['time'] = 'Recently';
                continue;
            }
            try {
                $time = new DateTime($activity['time']);
                $now = new DateTime();
                $diff = $now->diff($time);

                if ($diff->days > 0) {
                    $activity['time'] = $diff->days . ' day' . ($diff->days > 1 ? 's' : '') . ' ago';
                } elseif ($diff->h > 0) {
                    $activity['time'] = $diff->h . ' hour' . ($diff->h > 1 ? 's' : '') . ' ago';
                } elseif ($diff->i > 0) {
                    $activity['time'] = $diff->i . ' minute' . ($diff->i > 1 ? 's' : '') . ' ago';
                } else {
                    $activity['time'] = 'Just now';
                }
            } catch (Exception $e) {
                $activity['time'] = 'Recently';
            }
        }
        unset($activity);

        // ─── STREAK CALCULATION ──────────────────────────────────────────
        // A "streak day" is any day the user did something:
        //   - completed a task, added a plant, or wrote a journal entry
        // currentStreak = number of consecutive days ending today (or yesterday) with activity
        // longestStreak = longest run of consecutive activity days in history
        $streak_stmt = $db->prepare("
            SELECT DISTINCT activity_date FROM (
                SELECT DATE(updated_at) as activity_date FROM tasks
                    WHERE user_id = :user_id AND completed = 1 AND updated_at IS NOT NULL
                UNION
                SELECT DATE(created_at) as activity_date FROM plants
                    WHERE user_id = :user_id AND created_at IS NOT NULL
                UNION
                SELECT DATE(created_at) as activity_date FROM journals
                    WHERE user_id = :user_id AND created_at IS NOT NULL
            ) AS all_activity
            WHERE activity_date IS NOT NULL
            ORDER BY activity_date DESC
        ");
        $streak_stmt->bindParam(':user_id', $user_id);
        $streak_stmt->execute();
        $activity_days = $streak_stmt->fetchAll(PDO::FETCH_COLUMN, 0);

        $currentStreak = 0;
        $longestStreak = 0;
        $lastActivityDate = null;

        if (!empty($activity_days)) {
            $today = new DateTime('today');
            $yesterday = (new DateTime('today'))->modify('-1 day');

            // Convert all dates to DateTime objects, sorted descending
            $dateObjs = array_map(function($d) { return new DateTime($d); }, $activity_days);

            // Current streak: walk back from today/yesterday
            $first = $dateObjs[0];
            $lastActivityDate = $first->format('Y-m-d');

            if ($first == $today || $first == $yesterday) {
                $currentStreak = 1;
                $expected = clone $first;
                for ($i = 1; $i < count($dateObjs); $i++) {
                    $expected->modify('-1 day');
                    if ($dateObjs[$i] == $expected) {
                        $currentStreak++;
                    } else {
                        break;
                    }
                }
            }

            // Longest streak: walk through all dates
            $run = 1;
            $longestStreak = 1;
            for ($i = 1; $i < count($dateObjs); $i++) {
                $prev = clone $dateObjs[$i - 1];
                $prev->modify('-1 day');
                if ($dateObjs[$i] == $prev) {
                    $run++;
                    if ($run > $longestStreak) $longestStreak = $run;
                } else {
                    $run = 1;
                }
            }
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => [
                'totalPlants' => (int)$plant_count,
                'pendingTasks' => (int)$pending_tasks,
                'completionRate' => $completion_rate . '%',
                'completionRateNumber' => (int)$completion_rate,
                'recentActivity' => $recent_activity,
                'currentStreak' => $currentStreak,
                'longestStreak' => $longestStreak,
                'lastActivityDate' => $lastActivityDate
            ]
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>