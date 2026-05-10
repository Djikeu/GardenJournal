-- =============================================================
-- Plant Doctor — diagnosis storage
-- Run once against the `botanic_journal` database.
-- =============================================================

CREATE TABLE IF NOT EXISTS `plant_diagnoses` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `plant_id` INT UNSIGNED DEFAULT NULL,
  `image_path` VARCHAR(500) NOT NULL,
  `user_notes` TEXT DEFAULT NULL,
  `ai_summary` VARCHAR(500) DEFAULT NULL,
  `ai_diagnosis` TEXT DEFAULT NULL,
  `ai_recommendations` TEXT DEFAULT NULL,
  `ai_severity` ENUM('healthy','mild','moderate','severe','unknown') DEFAULT 'unknown',
  `ai_confidence` TINYINT UNSIGNED DEFAULT NULL,
  `raw_response` MEDIUMTEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`, `created_at`),
  KEY `idx_plant` (`plant_id`),
  CONSTRAINT `fk_diag_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
