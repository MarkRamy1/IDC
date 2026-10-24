-- =====================================================================
-- IDC MySQL Backend Schema
-- Compatible with MySQL 8.0+ / MariaDB in XAMPP
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `idc` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `idc`;

-- 1) Users table (Authentication)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(191) NULL UNIQUE,
  `phone` VARCHAR(32) NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Sessions table (Bearer tokens)
CREATE TABLE IF NOT EXISTS `sessions` (
  `token` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `aal` VARCHAR(16) NOT NULL DEFAULT 'aal1',
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sessions_user` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) OTP verification codes (Signup, Password reset, Vault MFA)
CREATE TABLE IF NOT EXISTS `otps` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `phone` VARCHAR(32) NOT NULL,
  `code` VARCHAR(16) NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_otps_phone_type` (`phone`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) Profiles: public user information
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `full_name` VARCHAR(191) NOT NULL DEFAULT '',
  `handle` VARCHAR(64) NOT NULL UNIQUE,
  `governorate` VARCHAR(64) NULL,
  `role` ENUM('student','grad','employee','owner') NOT NULL DEFAULT 'student',
  `photo_path` VARCHAR(255) NULL,
  `onboarded` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_profiles_user` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) Profile Private: sensitive personal details
CREATE TABLE IF NOT EXISTS `profile_private` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `national_id` VARCHAR(32) NULL,
  `birth_date` DATE NULL,
  `phone` VARCHAR(32) NULL,
  CONSTRAINT `fk_profile_private_user` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) Verified Issuers
CREATE TABLE IF NOT EXISTS `issuers` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL UNIQUE,
  `name_en` VARCHAR(191) NULL,
  `verified` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7) Documents and credentials (items)
CREATE TABLE IF NOT EXISTS `items` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `level` ENUM('public','private','secret') NOT NULL DEFAULT 'public',
  `type` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `value` TEXT NULL,
  `issuer_id` VARCHAR(36) NULL,
  `issuer_text` VARCHAR(255) NULL,
  `secret_until` DATETIME NULL,
  `on_card` TINYINT(1) NOT NULL DEFAULT 0,
  `file_path` VARCHAR(255) NULL,
  `file_name` VARCHAR(255) NULL,
  `file_kind` VARCHAR(32) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_items_user_level` (`user_id`, `level`),
  CONSTRAINT `fk_items_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_issuer` FOREIGN KEY (`issuer_id`) REFERENCES `issuers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8) Vault credentials (second-factor master secret)
CREATE TABLE IF NOT EXISTS `vault_credentials` (
  `user_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `pw_hash` VARCHAR(255) NOT NULL,
  `failed` INT NOT NULL DEFAULT 0,
  `locked_until` DATETIME NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_vault_credentials_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9) Vault unlocked sessions (2 minutes timeout)
CREATE TABLE IF NOT EXISTS `vault_sessions` (
  `user_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `expires_at` DATETIME NOT NULL,
  CONSTRAINT `fk_vault_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10) Security Access Logs
CREATE TABLE IF NOT EXISTS `access_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `action` VARCHAR(64) NOT NULL,
  `ok` TINYINT(1) NOT NULL,
  `at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_access_logs_user` (`user_id`, `at`),
  CONSTRAINT `fk_access_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed issuers
INSERT INTO `issuers` (`id`, `name`, `name_en`, `verified`) VALUES
  ('iss-01', 'وزارة الداخلية', 'Ministry of Interior', 1),
  ('iss-02', 'وزارة الاتصالات (ITI)', 'Ministry of Communications (ITI)', 1),
  ('iss-03', 'جامعة القاهرة', 'Cairo University', 1),
  ('iss-04', 'Cisco', 'Cisco', 1),
  ('iss-05', 'Microsoft', 'Microsoft', 1),
  ('iss-06', 'Coursera', 'Coursera', 1),
  ('iss-07', 'Udemy', 'Udemy', 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `name_en`=VALUES(`name_en`);
