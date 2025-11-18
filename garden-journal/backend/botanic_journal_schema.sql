-- Create database
CREATE DATABASE IF NOT EXISTS botanic_journal;
USE botanic_journal;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(500) NULL,
    level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Plants table
CREATE TABLE IF NOT EXISTS plants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(255),
    type ENUM('indoor', 'outdoor', 'succulent', 'tropical', 'vegetable', 'flowering') NOT NULL,
    image VARCHAR(500),
    status ENUM('healthy', 'warning', 'danger') DEFAULT 'healthy',
    last_watered DATE,
    temperature VARCHAR(50),
    light VARCHAR(100),
    humidity VARCHAR(50),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plant_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    due_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    progress INT DEFAULT 0,
    type ENUM('watering', 'fertilizing', 'pruning', 'repotting', 'pest_control', 'other') DEFAULT 'other',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL
);

-- Journal entries table
CREATE TABLE IF NOT EXISTS journals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plant_id INT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    images JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL
);

-- Weather data table
CREATE TABLE IF NOT EXISTS weather (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    temperature VARCHAR(50),
    condition VARCHAR(100),
    humidity VARCHAR(50),
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed library table
CREATE TABLE IF NOT EXISTS seeds (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(255),
    type ENUM('vegetable', 'fruit', 'herb', 'flower', 'succulent') NOT NULL,
    quantity INT DEFAULT 1,
    source VARCHAR(255),
    purchase_date DATE,
    expiration_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Garden planner table
CREATE TABLE IF NOT EXISTS garden_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    season ENUM('spring', 'summer', 'fall', 'winter') NOT NULL,
    year YEAR NOT NULL,
    layout_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Plant care schedules table
CREATE TABLE IF NOT EXISTS care_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plant_id INT NOT NULL,
    task_type ENUM('watering', 'fertilizing', 'pruning', 'repotting') NOT NULL,
    frequency_days INT NOT NULL,
    last_completed DATE,
    next_due DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
);

-- =============================================================================
-- INSERT SAMPLE DATA
-- =============================================================================

-- Insert sample user
INSERT INTO users (id, email, name, avatar, level) VALUES 
(1, 'user@example.com', 'Alex Morgan', 'https://i.pravatar.cc/150?img=12', 12);

-- Insert sample plants
INSERT INTO plants (id, user_id, name, species, type, image, status, last_watered, temperature, light, humidity, is_favorite) VALUES
(1, 1, 'Monstera Deliciosa', 'Monstera deliciosa', 'tropical', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'healthy', DATE_SUB(CURDATE(), INTERVAL 2 DAY), '22°C', 'Bright indirect', '65%', TRUE),
(2, 1, 'Snake Plant', 'Sansevieria trifasciata', 'succulent', 'https://images.unsplash.com/photo-1597848212624-a6eb4a53e97a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'healthy', DATE_SUB(CURDATE(), INTERVAL 7 DAY), '24°C', 'Low light', '40%', FALSE),
(3, 1, 'Cherry Tomato', 'Solanum lycopersicum', 'vegetable', 'https://images.unsplash.com/photo-1597848212624-e6d4bd66d38b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'warning', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '26°C', 'Full sun', '70%', FALSE),
(4, 1, 'Peace Lily', 'Spathiphyllum', 'flowering', 'https://images.unsplash.com/photo-1459156212016-c812468e2115?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'healthy', DATE_SUB(CURDATE(), INTERVAL 3 DAY), '20°C', 'Medium light', '60%', TRUE),
(5, 1, 'Basil', 'Ocimum basilicum', 'herb', 'https://images.unsplash.com/photo-1618375569909-3c8616cf3365?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'healthy', DATE_SUB(CURDATE(), INTERVAL 2 DAY), '25°C', 'Full sun', '50%', FALSE),
(6, 1, 'Fern', 'Nephrolepis exaltata', 'indoor', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'danger', DATE_SUB(CURDATE(), INTERVAL 5 DAY), '18°C', 'Low light', '80%', FALSE);

-- Insert sample tasks
INSERT INTO tasks (id, user_id, plant_id, title, description, priority, due_date, completed, progress, type) VALUES
(1, 1, 3, 'Water Tomato Plants', 'Tomatoes are looking dry and need immediate watering', 'high', CURDATE(), FALSE, 15, 'watering'),
(2, 1, 1, 'Check for pests on Monstera', 'Look for signs of spider mites or aphids', 'high', CURDATE(), FALSE, 5, 'pest_control'),
(3, 1, 4, 'Fertilize Peace Lily', 'Use balanced liquid fertilizer for flowering plants', 'medium', CURDATE(), FALSE, 90, 'fertilizing'),
(4, 1, 2, 'Repot Snake Plant', 'Plant has outgrown its current container', 'medium', DATE_ADD(CURDATE(), INTERVAL 7 DAY), FALSE, 0, 'repotting'),
(5, 1, 5, 'Harvest Basil', 'Ready for first harvest of the season', 'low', DATE_ADD(CURDATE(), INTERVAL 3 DAY), FALSE, 0, 'pruning'),
(6, 1, 6, 'Emergency watering for Fern', 'Fern is showing signs of severe dehydration', 'high', CURDATE(), FALSE, 10, 'watering'),
(7, 1, NULL, 'Clean gardening tools', 'Disinfect all pruning shears and tools', 'low', DATE_ADD(CURDATE(), INTERVAL 14 DAY), TRUE, 100, 'other'),
(8, 1, 1, 'Wipe Monstera leaves', 'Clean dust from leaves to improve photosynthesis', 'medium', DATE_ADD(CURDATE(), INTERVAL 2 DAY), FALSE, 0, 'other');

-- Insert sample journal entries
INSERT INTO journals (id, user_id, plant_id, title, content, images) VALUES
(1, 1, 1, 'First Fenestrated Leaf!', 'My Monstera has produced its first leaf with proper fenestrations! The leaf has 3 splits and is about 12 inches wide. The plant seems very happy in its current spot with bright indirect light. I''ve been watering it every 7-10 days and it''s been thriving.', '["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"]'),
(2, 1, 3, 'Tomato Plant Troubles', 'Noticed some yellowing leaves on the tomato plant. The lower leaves are turning yellow while the new growth looks healthy. Could be overwatering or nutrient deficiency. Will reduce watering frequency and add some tomato fertilizer next time.', NULL),
(3, 1, 4, 'Peace Lily Blooming', 'The Peace Lily has produced two beautiful white flowers! They emerged almost overnight. The plant has been in the bathroom where it gets good humidity from showers. Seems to love the consistent moisture.', '[]'),
(4, 1, NULL, 'Garden Planning for Spring', 'Planning the spring garden layout. Thinking of companion planting tomatoes with basil and marigolds. Need to start seeds indoors in about 4 weeks. Made a list of seeds to order: cherry tomatoes, basil, marigolds, zinnias, and cucumbers.', NULL);

-- Insert sample weather data
INSERT INTO weather (id, user_id, location, temperature, condition, humidity, recommendation) VALUES
(1, 1, 'Portland, OR', '68°F', 'Partly Cloudy', '65%', 'Perfect day for transplanting seedlings and light pruning. Good conditions for outdoor gardening activities.');

-- Insert sample seed library
INSERT INTO seeds (id, user_id, name, species, type, quantity, source, purchase_date, expiration_date, notes) VALUES
(1, 1, 'Cherry Tomato', 'Solanum lycopersicum', 'vegetable', 25, 'Local Nursery', '2024-01-15', '2026-01-15', 'Sweet 100 variety. High yield and disease resistant.'),
(2, 1, 'Genovese Basil', 'Ocimum basilicum', 'herb', 50, 'Baker Creek Seeds', '2024-02-01', '2026-02-01', 'Classic Italian basil with large leaves. Great for pesto.'),
(3, 1, 'French Marigold', 'Tagetes patula', 'flower', 100, 'Burpee', '2024-01-20', '2026-01-20', 'Companion plant for tomatoes. Natural pest deterrent.'),
(4, 1, 'Zinnia Mix', 'Zinnia elegans', 'flower', 75, 'Local Nursery', '2024-02-10', '2026-02-10', 'Colorful cut flowers. Attracts pollinators to the garden.');

-- Insert sample garden plans
INSERT INTO garden_plans (id, user_id, title, description, season, year, layout_data) VALUES
(1, 1, 'Spring Vegetable Garden 2024', 'Main vegetable garden layout with companion planting', 'spring', 2024, '{
    "beds": [
        {
            "name": "Bed 1",
            "plants": [
                {"name": "Tomato", "position": {"x": 10, "y": 10}, "companions": ["Basil", "Marigold"]},
                {"name": "Basil", "position": {"x": 15, "y": 10}, "companions": ["Tomato"]},
                {"name": "Marigold", "position": {"x": 20, "y": 10}, "companions": ["Tomato"]}
            ]
        },
        {
            "name": "Bed 2", 
            "plants": [
                {"name": "Zinnia", "position": {"x": 10, "y": 20}, "companions": []},
                {"name": "Cucumber", "position": {"x": 15, "y": 20}, "companions": []}
            ]
        }
    ]
}'),
(2, 1, 'Indoor Plant Arrangement', 'Living room plant placement for optimal light', 'winter', 2024, '{
    "rooms": [
        {
            "name": "Living Room",
            "plants": [
                {"name": "Monstera", "position": "East Window", "light": "Bright indirect"},
                {"name": "Snake Plant", "position": "North Corner", "light": "Low light"},
                {"name": "Peace Lily", "position": "Bathroom", "light": "Medium light"}
            ]
        }
    ]
}');

-- Insert sample care schedules
INSERT INTO care_schedules (id, user_id, plant_id, task_type, frequency_days, last_completed, next_due, notes) VALUES
(1, 1, 1, 'watering', 7, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Water when top 2 inches of soil are dry'),
(2, 1, 2, 'watering', 14, DATE_SUB(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Very drought tolerant. Be careful not to overwater.'),
(3, 1, 3, 'watering', 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Tomatoes need consistent moisture'),
(4, 1, 4, 'watering', 5, DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Keep soil consistently moist but not soggy'),
(5, 1, 1, 'fertilizing', 30, DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'Use balanced liquid fertilizer during growing season'),
(6, 1, 3, 'fertilizing', 14, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'Tomato-specific fertilizer with higher phosphorus');

-- =============================================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================================================

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Indexes for plants table
CREATE INDEX idx_plants_user_id ON plants(user_id);
CREATE INDEX idx_plants_type ON plants(type);
CREATE INDEX idx_plants_status ON plants(status);
CREATE INDEX idx_plants_is_favorite ON plants(is_favorite);
CREATE INDEX idx_plants_last_watered ON plants(last_watered);

-- Indexes for tasks table
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_plant_id ON tasks(plant_id);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_type ON tasks(type);

-- Indexes for journals table
CREATE INDEX idx_journals_user_id ON journals(user_id);
CREATE INDEX idx_journals_plant_id ON journals(plant_id);
CREATE INDEX idx_journals_created_at ON journals(created_at);

-- Indexes for weather table
CREATE INDEX idx_weather_user_id ON weather(user_id);
CREATE INDEX idx_weather_created_at ON weather(created_at);

-- Indexes for seeds table
CREATE INDEX idx_seeds_user_id ON seeds(user_id);
CREATE INDEX idx_seeds_type ON seeds(type);
CREATE INDEX idx_seeds_expiration_date ON seeds(expiration_date);

-- Indexes for garden_plans table
CREATE INDEX idx_garden_plans_user_id ON garden_plans(user_id);
CREATE INDEX idx_garden_plans_season_year ON garden_plans(season, year);

-- Indexes for care_schedules table
CREATE INDEX idx_care_schedules_user_id ON care_schedules(user_id);
CREATE INDEX idx_care_schedules_plant_id ON care_schedules(plant_id);
CREATE INDEX idx_care_schedules_next_due ON care_schedules(next_due);

-- =============================================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View for plants needing water (last watered more than 3 days ago)
CREATE VIEW plants_needing_water AS
SELECT p.*, 
       DATEDIFF(CURDATE(), p.last_watered) as days_since_watered
FROM plants p
WHERE p.last_watered IS NULL 
   OR p.last_watered < DATE_SUB(CURDATE(), INTERVAL 3 DAY)
ORDER BY days_since_watered DESC;

-- View for overdue tasks
CREATE VIEW overdue_tasks AS
SELECT t.*, p.name as plant_name
FROM tasks t
LEFT JOIN plants p ON t.plant_id = p.id
WHERE t.completed = 0 
  AND t.due_date < CURDATE()
ORDER BY t.priority DESC, t.due_date ASC;

-- View for plant health summary
CREATE VIEW plant_health_summary AS
SELECT 
    p.type,
    COUNT(*) as total_plants,
    SUM(CASE WHEN p.status = 'healthy' THEN 1 ELSE 0 END) as healthy_count,
    SUM(CASE WHEN p.status = 'warning' THEN 1 ELSE 0 END) as warning_count,
    SUM(CASE WHEN p.status = 'danger' THEN 1 ELSE 0 END) as danger_count,
    ROUND((SUM(CASE WHEN p.status = 'healthy' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as health_percentage
FROM plants p
GROUP BY p.type
ORDER BY health_percentage DESC;

-- View for monthly task completion
CREATE VIEW monthly_task_completion AS
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as month,
    COUNT(*) as total_tasks,
    SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_tasks,
    ROUND((SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as completion_rate
FROM tasks
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month DESC;

-- =============================================================================
-- SAMPLE QUERIES FOR TESTING
-- =============================================================================

-- Query to test plants needing water:
-- SELECT * FROM plants_needing_water;

-- Query to test overdue tasks:
-- SELECT * FROM overdue_tasks;

-- Query to test plant health summary:
-- SELECT * FROM plant_health_summary;

-- Query to get user's complete plant collection with latest status:
-- SELECT 
--     p.name,
--     p.type,
--     p.status,
--     p.last_watered,
--     DATEDIFF(CURDATE(), p.last_watered) as days_since_watered,
--     COUNT(t.id) as pending_tasks
-- FROM plants p
-- LEFT JOIN tasks t ON p.id = t.plant_id AND t.completed = 0
-- WHERE p.user_id = 1
-- GROUP BY p.id
-- ORDER BY p.is_favorite DESC, p.name ASC;