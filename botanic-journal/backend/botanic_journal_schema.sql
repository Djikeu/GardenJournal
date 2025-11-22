-- Create database
CREATE DATABASE IF NOT EXISTS `botanic_journal` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `botanic_journal`;

-- Users table
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `level` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

----
INSERT INTO `users` (`email`, `name`, `password`, `role`, `level`) 
VALUES ('admin@botanicjournal.com', 'Admin', 'admin123', 'admin', 10);
---

-- Plants table
CREATE TABLE `plants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `species` varchar(255) DEFAULT NULL,
  `type` enum('indoor','outdoor','succulent','tropical','vegetable','flowering') NOT NULL,
  `image` varchar(500) DEFAULT NULL,
  `status` enum('healthy','warning','danger') DEFAULT 'healthy',
  `last_watered` date DEFAULT NULL,
  `temperature` varchar(50) DEFAULT NULL,
  `light` varchar(100) DEFAULT NULL,
  `humidity` varchar(50) DEFAULT NULL,
  `is_favorite` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_plants_type` (`type`),
  KEY `idx_plants_status` (`status`),
  KEY `idx_plants_is_favorite` (`is_favorite`),
  KEY `idx_plants_last_watered` (`last_watered`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks table
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `plant_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `due_date` date DEFAULT NULL,
  `completed` tinyint(1) DEFAULT 0,
  `progress` int(11) DEFAULT 0,
  `type` enum('watering','fertilizing','pruning','repotting','pest_control','other') DEFAULT 'other',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `plant_id` (`plant_id`),
  KEY `idx_tasks_priority` (`priority`),
  KEY `idx_tasks_completed` (`completed`),
  KEY `idx_tasks_due_date` (`due_date`),
  KEY `idx_tasks_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Journal entries table
CREATE TABLE `journals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `plant_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `images` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `plant_id` (`plant_id`),
  KEY `idx_journals_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weather data table
CREATE TABLE `weather` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `location` varchar(255) NOT NULL,
  `temperature` varchar(50) DEFAULT NULL,
  `condition` varchar(100) DEFAULT NULL,
  `humidity` varchar(50) DEFAULT NULL,
  `recommendation` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_weather_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed library table
CREATE TABLE `seeds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `species` varchar(255) DEFAULT NULL,
  `type` enum('vegetable','fruit','herb','flower','succulent') NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `source` varchar(255) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_seeds_type` (`type`),
  KEY `idx_seeds_expiration_date` (`expiration_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Garden planner table
CREATE TABLE `garden_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `season` enum('spring','summer','fall','winter') NOT NULL,
  `year` year(4) NOT NULL,
  `layout_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_garden_plans_season_year` (`season`,`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plant care schedules table
CREATE TABLE `care_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `plant_id` int(11) NOT NULL,
  `task_type` enum('watering','fertilizing','pruning','repotting') NOT NULL,
  `frequency_days` int(11) NOT NULL,
  `last_completed` date DEFAULT NULL,
  `next_due` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `plant_id` (`plant_id`),
  KEY `idx_care_schedules_next_due` (`next_due`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints
ALTER TABLE `plants`
  ADD CONSTRAINT `plants_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`plant_id`) REFERENCES `plants` (`id`) ON DELETE SET NULL;

ALTER TABLE `journals`
  ADD CONSTRAINT `journals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `journals_ibfk_2` FOREIGN KEY (`plant_id`) REFERENCES `plants` (`id`) ON DELETE SET NULL;

ALTER TABLE `weather`
  ADD CONSTRAINT `weather_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `seeds`
  ADD CONSTRAINT `seeds_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `garden_plans`
  ADD CONSTRAINT `garden_plans_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `care_schedules`
  ADD CONSTRAINT `care_schedules_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `care_schedules_ibfk_2` FOREIGN KEY (`plant_id`) REFERENCES `plants` (`id`) ON DELETE CASCADE;

-- =============================================================================
-- INSERT SAMPLE DATA
-- =============================================================================

-- Insert sample user
INSERT INTO `users` (`id`, `email`, `name`, `avatar`, `level`) VALUES 
(1, 'user@example.com', 'Alex Morgan', 'https://i.pravatar.cc/150?img=12', 12);

-- Insert sample plants
INSERT INTO `plants` (`id`, `user_id`, `name`, `species`, `type`, `image`, `status`, `last_watered`, `temperature`, `light`, `humidity`, `is_favorite`) VALUES
(1, 1, 'Monstera Deliciosa', 'Monstera deliciosa', 'tropical', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'healthy', DATE_SUB(CURDATE(), INTERVAL 2 DAY), '22°C', 'Bright indirect', '65%', 1),
(2, 1, 'Snake Plant', 'Sansevieria trifasciata', 'succulent', 'https://images.unsplash.com/photo-1597848212624-a6eb4a53e97a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'healthy', DATE_SUB(CURDATE(), INTERVAL 7 DAY), '24°C', 'Low light', '40%', 0),
(3, 1, 'Cherry Tomato', 'Solanum lycopersicum', 'vegetable', 'https://images.unsplash.com/photo-1597848212624-e6d4bd66d38b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'warning', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '26°C', 'Full sun', '70%', 0),
(4, 1, 'Peace Lily', 'Spathiphyllum', 'flowering', 'https://images.unsplash.com/photo-1459156212016-c812468e2115?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'healthy', DATE_SUB(CURDATE(), INTERVAL 3 DAY), '20°C', 'Medium light', '60%', 1),
(5, 1, 'Basil', 'Ocimum basilicum', 'herb', 'https://images.unsplash.com/photo-1618375569909-3c8616cf3365?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'healthy', DATE_SUB(CURDATE(), INTERVAL 2 DAY), '25°C', 'Full sun', '50%', 0),
(6, 1, 'Fern', 'Nephrolepis exaltata', 'indoor', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'danger', DATE_SUB(CURDATE(), INTERVAL 5 DAY), '18°C', 'Low light', '80%', 0);

-- Insert sample tasks
INSERT INTO `tasks` (`id`, `user_id`, `plant_id`, `title`, `description`, `priority`, `due_date`, `completed`, `progress`, `type`) VALUES
(1, 1, 3, 'Water Tomato Plants', 'Tomatoes are looking dry and need immediate watering', 'high', CURDATE(), 0, 15, 'watering'),
(2, 1, 1, 'Check for pests on Monstera', 'Look for signs of spider mites or aphids', 'high', CURDATE(), 0, 5, 'pest_control'),
(3, 1, 4, 'Fertilize Peace Lily', 'Use balanced liquid fertilizer for flowering plants', 'medium', CURDATE(), 0, 90, 'fertilizing'),
(4, 1, 2, 'Repot Snake Plant', 'Plant has outgrown its current container', 'medium', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 0, 0, 'repotting'),
(5, 1, 5, 'Harvest Basil', 'Ready for first harvest of the season', 'low', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 0, 0, 'pruning'),
(6, 1, 6, 'Emergency watering for Fern', 'Fern is showing signs of severe dehydration', 'high', CURDATE(), 0, 10, 'watering'),
(7, 1, NULL, 'Clean gardening tools', 'Disinfect all pruning shears and tools', 'low', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 1, 100, 'other'),
(8, 1, 1, 'Wipe Monstera leaves', 'Clean dust from leaves to improve photosynthesis', 'medium', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 0, 0, 'other');

-- Insert sample journal entries
INSERT INTO `journals` (`id`, `user_id`, `plant_id`, `title`, `content`) VALUES
(1, 1, 1, 'First Fenestrated Leaf!', 'My Monstera has produced its first leaf with proper fenestrations! The leaf has 3 splits and is about 12 inches wide. The plant seems very happy in its current spot with bright indirect light. I''ve been watering it every 7-10 days and it''s been thriving.'),
(2, 1, 3, 'Tomato Plant Troubles', 'Noticed some yellowing leaves on the tomato plant. The lower leaves are turning yellow while the new growth looks healthy. Could be overwatering or nutrient deficiency. Will reduce watering frequency and add some tomato fertilizer next time.'),
(3, 1, 4, 'Peace Lily Blooming', 'The Peace Lily has produced two beautiful white flowers! They emerged almost overnight. The plant has been in the bathroom where it gets good humidity from showers. Seems to love the consistent moisture.'),
(4, 1, NULL, 'Garden Planning for Spring', 'Planning the spring garden layout. Thinking of companion planting tomatoes with basil and marigolds. Need to start seeds indoors in about 4 weeks. Made a list of seeds to order: cherry tomatoes, basil, marigolds, zinnias, and cucumbers.');

-- Insert sample weather data
INSERT INTO `weather` (`id`, `user_id`, `location`, `temperature`, `condition`, `humidity`, `recommendation`) VALUES
(1, 1, 'Portland, OR', '68°F', 'Partly Cloudy', '65%', 'Perfect day for transplanting seedlings and light pruning. Good conditions for outdoor gardening activities.');

-- Insert sample seed library
INSERT INTO `seeds` (`id`, `user_id`, `name`, `species`, `type`, `quantity`, `source`, `purchase_date`, `expiration_date`, `notes`) VALUES
(1, 1, 'Cherry Tomato', 'Solanum lycopersicum', 'vegetable', 25, 'Local Nursery', '2024-01-15', '2026-01-15', 'Sweet 100 variety. High yield and disease resistant.'),
(2, 1, 'Genovese Basil', 'Ocimum basilicum', 'herb', 50, 'Baker Creek Seeds', '2024-02-01', '2026-02-01', 'Classic Italian basil with large leaves. Great for pesto.'),
(3, 1, 'French Marigold', 'Tagetes patula', 'flower', 100, 'Burpee', '2024-01-20', '2026-01-20', 'Companion plant for tomatoes. Natural pest deterrent.'),
(4, 1, 'Zinnia Mix', 'Zinnia elegans', 'flower', 75, 'Local Nursery', '2024-02-10', '2026-02-10', 'Colorful cut flowers. Attracts pollinators to the garden.');

-- Insert sample garden plans
INSERT INTO `garden_plans` (`id`, `user_id`, `title`, `description`, `season`, `year`, `layout_data`) VALUES
(1, 1, 'Spring Vegetable Garden 2024', 'Main vegetable garden layout with companion planting', 'spring', 2024, '{\"beds\": [{\"name\": \"Bed 1\", \"plants\": [{\"name\": \"Tomato\", \"position\": {\"x\": 10, \"y\": 10}, \"companions\": [\"Basil\", \"Marigold\"]}, {\"name\": \"Basil\", \"position\": {\"x\": 15, \"y\": 10}, \"companions\": [\"Tomato\"]}, {\"name\": \"Marigold\", \"position\": {\"x\": 20, \"y\": 10}, \"companions\": [\"Tomato\"]}]}, {\"name\": \"Bed 2\", \"plants\": [{\"name\": \"Zinnia\", \"position\": {\"x\": 10, \"y\": 20}, \"companions\": []}, {\"name\": \"Cucumber\", \"position\": {\"x\": 15, \"y\": 20}, \"companions\": []}]}]}'),
(2, 1, 'Indoor Plant Arrangement', 'Living room plant placement for optimal light', 'winter', 2024, '{\"rooms\": [{\"name\": \"Living Room\", \"plants\": [{\"name\": \"Monstera\", \"position\": \"East Window\", \"light\": \"Bright indirect\"}, {\"name\": \"Snake Plant\", \"position\": \"North Corner\", \"light\": \"Low light\"}, {\"name\": \"Peace Lily\", \"position\": \"Bathroom\", \"light\": \"Medium light\"}]}]}');

-- Insert sample care schedules
INSERT INTO `care_schedules` (`id`, `user_id`, `plant_id`, `task_type`, `frequency_days`, `last_completed`, `next_due`, `notes`) VALUES
(1, 1, 1, 'watering', 7, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Water when top 2 inches of soil are dry'),
(2, 1, 2, 'watering', 14, DATE_SUB(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Very drought tolerant. Be careful not to overwater.'),
(3, 1, 3, 'watering', 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Tomatoes need consistent moisture'),
(4, 1, 4, 'watering', 5, DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Keep soil consistently moist but not soggy'),
(5, 1, 1, 'fertilizing', 30, DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'Use balanced liquid fertilizer during growing season'),
(6, 1, 3, 'fertilizing', 14, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'Tomato-specific fertilizer with higher phosphorus');