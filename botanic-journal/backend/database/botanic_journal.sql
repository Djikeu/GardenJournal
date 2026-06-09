-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 28, 2025 at 08:55 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `botanic_journal`
--

-- --------------------------------------------------------

--
-- Table structure for table `care_schedules`
--

CREATE TABLE `care_schedules` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `plant_id` int(11) NOT NULL,
  `task_type` enum('watering','fertilizing','pruning','repotting') NOT NULL,
  `frequency_days` int(11) NOT NULL,
  `last_completed` date DEFAULT NULL,
  `next_due` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `garden_plans`
--

CREATE TABLE `garden_plans` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `season` enum('spring','summer','fall','winter') NOT NULL,
  `year` year(4) NOT NULL,
  `layout_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`layout_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `journals`
--

CREATE TABLE `journals` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `plant_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `images` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `journals`
--

INSERT INTO `journals` (`id`, `user_id`, `plant_id`, `title`, `content`, `images`, `created_at`, `updated_at`) VALUES
(1, 7, 191, 'dfgtfhzgjsdfsdf', 'sdfghgfdcvbnghrfedcvbnjhgfdfghnjzztgrfdfgbgnhjgfvgbhjmgfdghnjmujmngbfvrgthzujhnbvfgthzujijhngbfrthzujikjmhngbfvdcsxdfrgthzujikolujzhtrewqwe34rt5z67ujikjmhngbfvdasdfasdfasfd', NULL, '2025-11-23 17:54:28', '2025-12-01 22:08:45'),
(11, 7, 190, 'asdadad', 'asdasdasd', NULL, '2025-12-01 21:46:28', '2025-12-01 21:46:28'),
(12, 7, 191, 'asdasdasdfdgfgh', 'asdasdasdaewsdfsafs', NULL, '2025-12-01 21:50:15', '2025-12-01 22:02:45');

-- --------------------------------------------------------

--
-- Table structure for table `plants`
--

CREATE TABLE `plants` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL DEFAULT 1,
  `name` varchar(255) NOT NULL,
  `species` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `type` enum('indoor','outdoor','succulent','tropical','vegetable','flowering') NOT NULL,
  `light_requirements` varchar(100) DEFAULT NULL,
  `temperature_range` varchar(100) DEFAULT NULL,
  `humidity_requirements` varchar(100) DEFAULT NULL,
  `watering_schedule` varchar(100) DEFAULT NULL,
  `growth_rate` enum('Slow','Moderate','Fast') DEFAULT NULL,
  `difficulty` enum('Easy','Moderate','Advanced') DEFAULT NULL,
  `care_instructions` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `status` enum('healthy','warning','danger') DEFAULT 'healthy',
  `last_watered` date DEFAULT NULL,
  `temperature` varchar(50) DEFAULT NULL,
  `light` varchar(100) DEFAULT NULL,
  `humidity` varchar(50) DEFAULT NULL,
  `is_favorite` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_encyclopedia` tinyint(1) DEFAULT 0,
  `encyclopedia_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `plants`
--

INSERT INTO `plants` (`id`, `user_id`, `name`, `species`, `description`, `type`, `light_requirements`, `temperature_range`, `humidity_requirements`, `watering_schedule`, `growth_rate`, `difficulty`, `care_instructions`, `image_url`, `image`, `status`, `last_watered`, `temperature`, `light`, `humidity`, `is_favorite`, `created_at`, `updated_at`, `is_encyclopedia`, `encyclopedia_id`) VALUES
(119, 0, 'Snake Plant', 'Dracaena trifasciata', 'A hardy indoor plant with tall, upright leaves that are great for beginners.', 'indoor', 'Low to Bright Indirect', NULL, NULL, 'Every 2-3 weeks', NULL, NULL, 'Allow soil to dry between waterings. Tolerates low light.', 'https://images.unsplash.com/photo-1593489060060-0c7d8b15c29f?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:02:50', '2025-11-21 22:10:23', 1, NULL),
(120, 0, 'Peace Lily', 'Spathiphyllum wallisii', 'Beautiful flowering plant with dark green leaves and white flowers.', 'indoor', 'Medium Indirect', NULL, NULL, 'Weekly', NULL, NULL, 'Keep soil moist but not soggy. Mist leaves regularly.', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:02:50', '2025-11-21 22:10:23', 1, NULL),
(121, 0, 'Tomato', 'Solanum lycopersicum', 'Popular vegetable plant that produces delicious red fruits.', 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, 'Needs plenty of sun and consistent watering.', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:02:50', '2025-11-21 22:10:23', 1, NULL),
(122, 0, 'Basil', 'Ocimum basilicum', 'Aromatic herb perfect for cooking and companion planting.', 'vegetable', 'Full Sun to Partial Shade', NULL, NULL, 'Every 2-3 days', NULL, NULL, 'Pinch flowers to encourage leaf growth.', 'https://images.unsplash.com/photo-1618375569909-3c8616cf0353?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:02:50', '2025-11-21 22:10:23', 1, NULL),
(123, 0, 'Succulent Collection', 'Various species', 'Low-maintenance plants that store water in their leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3-4 weeks', NULL, NULL, 'Water thoroughly then let soil dry completely.', 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:02:50', '2025-11-21 22:10:23', 1, NULL),
(124, 0, 'Orchid', 'Phalaenopsis species', 'Elegant flowering plant with long-lasting blooms.', 'flowering', 'Bright Indirect', NULL, NULL, 'Weekly', NULL, NULL, 'Water when potting mix is dry. Avoid direct sun.', 'https://images.unsplash.com/photo-1517233165167-2e3e2e2e2e2e?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:02:50', '2025-11-21 22:10:23', 1, NULL),
(125, 0, 'Lavender', 'Lavandula angustifolia', 'Fragrant herb with purple flowers, great for gardens.', 'outdoor', 'Full Sun', NULL, NULL, 'Weekly', NULL, NULL, 'Prefers well-draining soil and full sunlight.', 'https://images.unsplash.com/photo-1597848212624-e6d4bd6dfd17?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:02:50', '2025-11-21 22:10:23', 1, NULL),
(126, 0, 'Monstera', 'Monstera deliciosa', 'Tropical plant with unique split leaves, very popular.', 'tropical', 'Bright Indirect', NULL, NULL, 'Every 1-2 weeks', NULL, NULL, 'Likes humidity. Wipe leaves occasionally.', 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:02:50', '2025-11-21 22:10:23', 1, NULL),
(127, 0, 'Rose', 'Rosa species', 'Classic flowering shrub with fragrant blooms.', 'flowering', 'Full Sun', NULL, NULL, 'Twice weekly', NULL, NULL, 'Prune regularly. Watch for pests.', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:02:50', '2025-11-21 22:10:23', 1, NULL),
(128, 0, 'Aloe Vera', 'Aloe barbadensis', 'Medicinal plant with soothing gel in its leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, 'Great for sunburns. Very drought tolerant.', 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:02:50', '2025-11-21 22:10:23', 1, NULL),
(129, 0, 'Snake Plant', 'Dracaena trifasciata', 'Hardy indoor plant with tall, upright leaves.', 'indoor', 'Low to Bright Indirect', NULL, NULL, 'Every 2-3 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1593489060060-0c7d8b15c29f?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:10:33', '2025-11-21 22:10:33', 1, NULL),
(130, 0, 'Peace Lily', 'Spathiphyllum wallisii', 'Beautiful flowering plant with white blooms.', 'indoor', 'Medium Indirect', NULL, NULL, 'Weekly', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:10:33', '2025-11-21 22:10:33', 1, NULL),
(131, 0, 'Tomato', 'Solanum lycopersicum', 'Popular vegetable that produces red fruits.', 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:10:33', '2025-11-21 22:10:33', 1, NULL),
(132, 0, 'Basil', 'Ocimum basilicum', 'Aromatic herb perfect for cooking.', 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1618375569909-3c8616cf0353?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:10:33', '2025-11-21 22:10:33', 1, NULL),
(133, 0, 'Succulent', 'Various species', 'Low-maintenance plants that store water.', 'succulent', 'Bright Light', NULL, NULL, 'Every 3-4 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:10:33', '2025-11-21 22:10:33', 1, NULL),
(134, 3, 'Snake Plant', 'Dracaena trifasciata', NULL, 'indoor', 'Low Light', NULL, NULL, 'Every 2-3 weeks', NULL, NULL, NULL, 'https://example.com/snake.jpg', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:10:44', '2025-11-22 22:11:22', 1, NULL),
(135, 3, 'Peace Lily', 'Spathiphyllum', NULL, 'indoor', 'Medium Light', NULL, NULL, 'Weekly', NULL, NULL, NULL, 'https://example.com/peace-lily.jpg', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:10:44', '2025-11-22 22:11:22', 1, NULL),
(136, 3, 'Aloe Vera', 'Aloe barbadensis', NULL, 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:17:35', '2025-11-22 22:11:22', 0, NULL),
(137, 3, 'Basil', 'Ocimum basilicum', NULL, 'vegetable', 'Full Sun to Partial Shade', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-21 22:17:46', '2025-11-22 22:11:22', 0, NULL),
(138, 3, 'Aloe Vera', 'Aloe barbadensis', NULL, 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 13:16:49', '2025-11-22 22:11:22', 0, NULL),
(139, 3, 'Basil', 'Ocimum basilicum', NULL, 'vegetable', 'Full Sun to Partial Shade', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 13:17:53', '2025-11-22 22:11:22', 0, NULL),
(140, 3, 'Aloe Vera', 'Aloe barbadensis', NULL, 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 13:17:56', '2025-11-22 22:11:22', 0, NULL),
(141, 3, 'Lavender', 'Lavandula angustifolia', NULL, 'outdoor', 'Full Sun', NULL, NULL, 'Weekly', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 13:42:42', '2025-11-22 22:11:22', 0, NULL),
(142, 3, 'Monstera', 'Monstera deliciosa', NULL, 'tropical', 'Bright Indirect', NULL, NULL, 'Every 1-2 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 13:42:45', '2025-11-22 22:11:22', 0, NULL),
(143, 3, 'Aloe Vera', 'Aloe barbadensis', NULL, 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 13:43:12', '2025-11-22 22:11:22', 0, NULL),
(144, 3, 'Lavender', 'Lavandula angustifolia', NULL, 'outdoor', 'Full Sun', NULL, NULL, 'Weekly', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 13:43:16', '2025-11-22 22:11:22', 0, NULL),
(145, 3, 'Aloe Vera', 'Aloe barbadensis', NULL, 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 13:43:44', '2025-11-22 22:11:22', 0, NULL),
(146, 3, 'Basil', 'Ocimum basilicum', NULL, 'vegetable', 'Full Sun to Partial Shade', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 13:43:45', '2025-11-22 22:11:22', 0, NULL),
(147, 3, 'Aloe Vera', 'Aloe barbadensis', NULL, 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 14:13:45', '2025-11-22 22:11:22', 0, NULL),
(148, 3, 'Aloe Vera', 'Aloe barbadensis', NULL, 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 14:13:55', '2025-11-22 22:11:22', 0, NULL),
(149, 3, 'Aloe Vera', 'Aloe barbadensis', NULL, 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 16:46:14', '2025-11-22 22:11:22', 0, NULL),
(150, 3, 'Basil', 'Ocimum basilicum', NULL, 'vegetable', 'Full Sun to Partial Shade', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 16:46:16', '2025-11-22 22:11:22', 0, NULL),
(151, 3, 'Lavender', 'Lavandula angustifolia', NULL, 'outdoor', 'Full Sun', NULL, NULL, 'Weekly', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 16:46:19', '2025-11-22 22:11:22', 0, NULL),
(152, 3, 'Basil', 'Ocimum basilicum', NULL, 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 16:46:20', '2025-11-22 22:11:22', 0, NULL),
(153, 3, 'Aloe Vera', 'Aloe barbadensis', NULL, 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 20:51:15', '2025-11-22 22:11:22', 0, NULL),
(154, 3, 'Basil', 'Ocimum basilicum', NULL, 'vegetable', 'Full Sun to Partial Shade', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 20:51:23', '2025-11-22 22:11:22', 0, NULL),
(155, 3, 'Tomato', 'Solanum lycopersicum', NULL, 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 20:51:42', '2025-11-22 22:11:22', 0, NULL),
(156, 3, 'Succulent Collection', 'Various species', NULL, 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3-4 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 20:51:44', '2025-11-22 22:11:22', 0, NULL),
(157, 3, 'Aloe Vera', 'Aloe barbadensis', NULL, 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:01:47', '2025-11-22 22:11:22', 0, NULL),
(158, 3, 'Spider Plant', 'Chlorophytum comosum', 'Air-purifying plant that produces baby spiderettes. Great for beginners.', 'indoor', 'Medium to bright indirect light', NULL, NULL, 'Weekly', NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'healthy', NULL, NULL, 'Medium light', NULL, 0, '2025-11-22 21:17:06', '2025-11-22 22:11:22', 1, NULL),
(159, 3, 'Jade Plant', 'Crassula ovata', 'Symbol of good luck. Thick, glossy leaves that store water.', 'succulent', 'Bright direct light', NULL, NULL, 'Every 2-3 weeks', NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'healthy', NULL, NULL, 'Bright light', NULL, 0, '2025-11-22 21:17:06', '2025-11-22 22:11:22', 1, NULL),
(160, 3, 'Aloe Vera', 'Aloe barbadensis', 'Medicinal plant with soothing gel in its leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=300', '', 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:26:21', '2025-11-22 22:11:22', 0, 128),
(161, 3, 'Basil', 'Ocimum basilicum', 'Aromatic herb perfect for cooking.', 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1618375569909-3c8616cf0353?w=300', '', 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:26:57', '2025-11-22 22:11:22', 0, 132),
(162, 3, 'Basil', 'Ocimum basilicum', 'Aromatic herb perfect for cooking.', 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:30:39', '2025-11-22 22:11:22', 1, NULL),
(163, 3, 'Snake Plant', 'Sansevieria', 'Great for beginners.', 'indoor', 'Low Light', NULL, NULL, 'Every 2-3 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:30:39', '2025-11-22 22:11:22', 1, NULL),
(164, 3, 'Jade Plant', 'Crassula ovata', 'Symbol of good luck. Thick, glossy leaves that store water.', 'succulent', 'Bright direct light', NULL, NULL, 'Every 2-3 weeks', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:31:52', '2025-11-22 22:11:22', 0, 159),
(165, 3, 'Peace Lily', 'Spathiphyllum wallisii', 'Beautiful flowering plant with white blooms.', 'indoor', 'Medium Indirect', NULL, NULL, 'Weekly', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:38:30', '2025-11-22 22:11:22', 0, 130),
(166, 3, 'Basil 2', 'Ocimum basilicum', 'Aromatic herb perfect for cooking.', 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1618375569909-3c8616cf0353?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:43:36', '2025-11-22 22:11:22', 0, 132),
(167, 3, 'Peace Lily', 'Spathiphyllum', NULL, 'indoor', 'Medium Light', NULL, NULL, 'Weekly', NULL, NULL, NULL, 'https://example.com/peace-lily.jpg', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:43:40', '2025-11-22 22:11:22', 0, 135),
(168, 3, 'Basil', 'Ocimum basilicum', 'Aromatic herb perfect for cooking.', 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:44:53', '2025-11-22 22:11:22', 0, 162),
(169, 3, 'Aloe Vera 2', 'Aloe barbadensis', 'Medicinal plant with soothing gel in its leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:44:55', '2025-11-22 22:11:22', 0, 128),
(170, 3, 'Aloe Vera 3', 'Aloe barbadensis', 'Medicinal plant with soothing gel in its leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:44:56', '2025-11-22 22:11:22', 0, 128),
(171, 3, 'Basil 2', 'Ocimum basilicum', 'Aromatic herb perfect for cooking.', 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:47:13', '2025-11-22 22:11:22', 0, 162),
(172, 3, 'Basil 3', 'Ocimum basilicum', 'Aromatic herb perfect for cooking.', 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1618375569909-3c8616cf0353?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:48:33', '2025-11-22 22:11:22', 0, 132),
(173, 3, 'Orchid', 'Phalaenopsis species', 'Elegant flowering plant with long-lasting blooms.', 'flowering', 'Bright Indirect', NULL, NULL, 'Weekly', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1517233165167-2e3e2e2e2e2e?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:48:46', '2025-11-22 22:11:22', 0, 124),
(174, 3, 'Aloe Vera 4', 'Aloe barbadensis', 'Medicinal plant with soothing gel in its leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:48:48', '2025-11-22 22:11:22', 0, 128),
(175, 3, 'Tomato', 'Solanum lycopersicum', 'Popular vegetable that produces red fruits.', 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:51:59', '2025-11-22 22:11:22', 0, 131),
(176, 3, 'Aloe Vera 5', 'Aloe barbadensis', 'Medicinal plant with soothing gel in its leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:55:09', '2025-11-22 22:11:22', 0, 128),
(177, 3, 'Aloe Vera 6', 'Aloe barbadensis', 'Medicinal plant with soothing gel in its leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:56:32', '2025-11-22 22:11:22', 0, 128),
(178, 3, 'Basil 4', 'Ocimum basilicum', 'Aromatic herb perfect for cooking.', 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1618375569909-3c8616cf0353?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 21:59:16', '2025-11-22 22:11:22', 0, 132),
(179, 3, 'Aloe Vera 7', 'Aloe barbadensis', 'Medicinal plant with soothing gel in its leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 22:01:24', '2025-11-22 22:11:22', 0, 128),
(180, 3, 'Orchid 2', 'Phalaenopsis species', 'Elegant flowering plant with long-lasting blooms.', 'flowering', 'Bright Indirect', NULL, NULL, 'Weekly', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1517233165167-2e3e2e2e2e2e?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 22:01:52', '2025-11-22 22:11:22', 0, 124),
(181, 3, 'Lavender', 'Lavandula angustifolia', 'Fragrant herb with purple flowers, great for gardens.', 'outdoor', 'Full Sun', NULL, NULL, 'Weekly', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1597848212624-e6d4bd6dfd17?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 22:01:55', '2025-11-22 22:11:22', 0, 125),
(182, 3, 'Aloe Vera 8', 'Aloe barbadensis', 'Medicinal plant with soothing gel in its leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 22:05:58', '2025-11-22 22:11:22', 0, 128),
(183, 3, 'Lavender 2', 'Lavandula angustifolia', 'Fragrant herb with purple flowers, great for gardens.', 'outdoor', 'Full Sun', NULL, NULL, 'Weekly', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1597848212624-e6d4bd6dfd17?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 22:06:09', '2025-11-22 22:11:22', 0, 125),
(184, 1, 'Aloe Vera', 'Aloe barbadensis', 'Medicinal plant with soothing gel in its leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 22:15:56', '2025-11-22 22:15:56', 0, 128),
(185, 1, 'Aloe Vera 2', 'Aloe barbadensis', 'Medicinal plant with soothing gel in its leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 22:16:14', '2025-11-22 22:16:14', 0, 128),
(186, 1, 'Aloe Vera 3', 'Aloe barbadensis', 'Medicinal plant with soothing gel in its leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 22:18:30', '2025-11-22 22:18:30', 0, 128),
(187, 6, 'Aloe Vera', 'Aloe barbadensis', 'Medicinal plant with soothing gel in its leaves.', 'succulent', 'Bright Indirect', NULL, NULL, 'Every 3 weeks', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 22:24:47', '2025-11-22 22:24:47', 0, 128),
(188, 6, 'Basil', 'Ocimum basilicum', 'Aromatic herb perfect for cooking.', 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, NULL, NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 22:25:07', '2025-11-22 22:25:07', 0, 162),
(189, 7, 'Basil', 'Ocimum basilicum', 'Aromatic herb perfect for cooking.', 'vegetable', 'Full Sun', NULL, NULL, 'Every 2-3 days', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1618375569909-3c8616cf0353?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-22 22:25:45', '2025-11-22 22:25:45', 0, 132),
(190, 7, 'Orchid', 'Phalaenopsis species', 'Elegant flowering plant with long-lasting blooms.', 'flowering', 'Bright Indirect', NULL, NULL, 'Weekly', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1517233165167-2e3e2e2e2e2e?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 1, '2025-11-22 22:25:47', '2025-11-22 22:29:08', 0, 124),
(191, 7, 'Orchid 2', 'Phalaenopsis species', 'Elegant flowering plant with long-lasting blooms.', 'flowering', 'Bright Indirect', NULL, NULL, 'Weekly', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1517233165167-2e3e2e2e2e2e?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-23 18:24:34', '2025-11-23 18:24:34', 0, 124),
(192, 7, 'Rose', 'Rosa species', 'Classic flowering shrub with fragrant blooms.', 'flowering', 'Full Sun', NULL, NULL, 'Twice weekly', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300', NULL, 'healthy', NULL, NULL, NULL, NULL, 0, '2025-11-23 18:24:38', '2025-11-23 18:24:38', 0, 127);

-- --------------------------------------------------------

--
-- Table structure for table `seeds`
--

CREATE TABLE `seeds` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `user_id`, `plant_id`, `title`, `description`, `priority`, `due_date`, `completed`, `progress`, `type`, `created_at`, `updated_at`) VALUES
(13, 7, 189, 'pranje', 'sdsfdsd', 'low', '2025-02-02', 1, 100, 'pruning', '2025-11-23 16:22:46', '2025-11-23 16:39:12'),
(14, 7, 189, 'dfgddfgd', 'dsfgfhjcvfbghjmhgfdxcvhjgc', 'high', '2025-11-25', 0, 5, 'pest_control', '2025-11-23 16:39:00', '2025-11-23 16:39:00'),
(15, 7, 190, 'dfgddfgd', 'cfghjhhgfdfgh', 'low', '2025-12-02', 0, 10, 'fertilizing', '2025-11-23 16:40:02', '2025-12-01 21:51:33'),
(16, 7, 190, 'pranje', 'SDFSFS', 'medium', '2025-12-03', 1, 100, 'repotting', '2025-12-01 22:12:58', '2025-12-01 22:13:01');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `level` int(11) DEFAULT 1,
  `role` enum('user','admin') DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `name`, `password`, `avatar`, `level`, `role`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
(2, 'admin@botanicjournal.com', 'Admin', 'admin123', NULL, 10, 'admin', 1, NULL, '2025-11-21 21:04:06', '2025-11-21 21:04:06'),
(3, 'abc@example.com', 'sigma123', '$2y$10$VbYADfZ7uf0XxjjwNUCBO.ZfQHVW1y8RKUtmMXte25CigyGI1pI4G', NULL, 1, 'user', 1, '2025-11-22 22:42:19', '2025-11-21 21:04:39', '2025-11-22 22:42:19'),
(4, 'abc2@example.com', 'sigma123', '$2y$10$tCV9BTHIzFy1RfdrQrGXwe2hplNc0fRwfcV8dZyzc7nTktIPAdjYy', NULL, 1, 'user', 1, '2025-11-22 22:15:46', '2025-11-21 22:50:57', '2025-11-22 22:15:46'),
(5, 'abc@example3.com', 'ime', '$2y$10$QO.wJJ5yWf8vyDOvA1Tnt.uFiZFNoGGts9o2w1MHMQ1dKwH.fnnui', NULL, 1, 'user', 1, '2025-11-22 22:17:00', '2025-11-22 21:18:41', '2025-11-22 22:17:00'),
(6, 'abc4@example.com', 'test', '$2y$10$s5Tr/08OSsMRBtF29OFMaOX/OzqztPirBVTCjwABEqH9QcBKYOQHW', NULL, 1, 'user', 1, '2025-11-22 22:18:26', '2025-11-22 22:18:15', '2025-11-22 22:18:26'),
(7, 'abc7@example.com', 'test7', '$2y$10$8Q78T34h0qr2MMIKmayEEObEimIN1eZRCKg/SARzVLs/STl.bJyoe', NULL, 1, 'user', 1, '2025-11-22 22:43:42', '2025-11-22 22:25:33', '2025-11-22 22:43:42');

-- --------------------------------------------------------

--
-- Table structure for table `weather`
--

CREATE TABLE `weather` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `location` varchar(255) NOT NULL,
  `temperature` varchar(50) DEFAULT NULL,
  `condition` varchar(100) DEFAULT NULL,
  `humidity` varchar(50) DEFAULT NULL,
  `recommendation` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `care_schedules`
--
ALTER TABLE `care_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `plant_id` (`plant_id`),
  ADD KEY `idx_care_schedules_next_due` (`next_due`);

--
-- Indexes for table `garden_plans`
--
ALTER TABLE `garden_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_garden_plans_season_year` (`season`,`year`);

--
-- Indexes for table `journals`
--
ALTER TABLE `journals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_plant_id` (`plant_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `plants`
--
ALTER TABLE `plants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_plants_type` (`type`),
  ADD KEY `idx_plants_status` (`status`),
  ADD KEY `idx_plants_is_favorite` (`is_favorite`),
  ADD KEY `idx_plants_last_watered` (`last_watered`),
  ADD KEY `idx_plants_user_id` (`user_id`);

--
-- Indexes for table `seeds`
--
ALTER TABLE `seeds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_seeds_type` (`type`),
  ADD KEY `idx_seeds_expiration_date` (`expiration_date`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `plant_id` (`plant_id`),
  ADD KEY `idx_tasks_priority` (`priority`),
  ADD KEY `idx_tasks_completed` (`completed`),
  ADD KEY `idx_tasks_due_date` (`due_date`),
  ADD KEY `idx_tasks_type` (`type`),
  ADD KEY `idx_tasks_user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `weather`
--
ALTER TABLE `weather`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_weather_created_at` (`created_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `care_schedules`
--
ALTER TABLE `care_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `garden_plans`
--
ALTER TABLE `garden_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `journals`
--
ALTER TABLE `journals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `plants`
--
ALTER TABLE `plants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=193;

--
-- AUTO_INCREMENT for table `seeds`
--
ALTER TABLE `seeds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `weather`
--
ALTER TABLE `weather`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `care_schedules`
--
ALTER TABLE `care_schedules`
  ADD CONSTRAINT `care_schedules_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `care_schedules_ibfk_2` FOREIGN KEY (`plant_id`) REFERENCES `plants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `garden_plans`
--
ALTER TABLE `garden_plans`
  ADD CONSTRAINT `garden_plans_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `journals`
--
ALTER TABLE `journals`
  ADD CONSTRAINT `journals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `journals_ibfk_2` FOREIGN KEY (`plant_id`) REFERENCES `plants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `seeds`
--
ALTER TABLE `seeds`
  ADD CONSTRAINT `seeds_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`plant_id`) REFERENCES `plants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `weather`
--
ALTER TABLE `weather`
  ADD CONSTRAINT `weather_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
