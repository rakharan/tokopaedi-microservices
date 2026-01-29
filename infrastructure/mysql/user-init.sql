-- User Service Database Initialization
-- This script will create the necessary tables for the User Service

CREATE DATABASE IF NOT EXISTS user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE user_db;

-- User Groups Table
CREATE TABLE IF NOT EXISTS user_groups (
  level_id TINYINT(1) NOT NULL AUTO_INCREMENT,
  group_name VARCHAR(255) NOT NULL,
  PRIMARY KEY (level_id),
  UNIQUE KEY group_name (group_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Rules Table
CREATE TABLE IF NOT EXISTS user_rules (
  rules_id INT(11) NOT NULL AUTO_INCREMENT,
  rules VARCHAR(255) NOT NULL,
  PRIMARY KEY (rules_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Group Rules Junction Table
CREATE TABLE IF NOT EXISTS user_group_rules (
  id INT(11) NOT NULL AUTO_INCREMENT,
  group_id TINYINT(1) DEFAULT NULL,
  rules_id INT(11) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY rules_id (rules_id),
  KEY group_id (group_id),
  CONSTRAINT user_group_rules_ibfk_1 FOREIGN KEY (rules_id) REFERENCES user_rules (rules_id) ON DELETE CASCADE,
  CONSTRAINT user_group_rules_ibfk_2 FOREIGN KEY (group_id) REFERENCES user_groups (level_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Table
CREATE TABLE IF NOT EXISTS user (
  id INT(11) NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  level TINYINT(1) NOT NULL DEFAULT 3,
  created_at INT(11) NOT NULL,
  is_deleted TINYINT(1) DEFAULT 0 COMMENT '0 = false, 1 = true',
  is_verified TINYINT(1) DEFAULT 0,
  email_token VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY email (email),
  KEY level (level),
  CONSTRAINT user_ibfk_1 FOREIGN KEY (level) REFERENCES user_groups (level_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Log Table
CREATE TABLE IF NOT EXISTS log (
  id INT(11) NOT NULL AUTO_INCREMENT,
  user_id INT(11) NOT NULL,
  action VARCHAR(100) NOT NULL,
  ip VARCHAR(150) NOT NULL,
  browser VARCHAR(255) NOT NULL,
  time INT(11) NOT NULL,
  PRIMARY KEY (id),
  KEY user_id (user_id),
  CONSTRAINT log_ibfk_1 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default user groups
INSERT INTO user_groups (level_id, group_name) VALUES
(1, 'Super Admin'),
(2, 'Admin'),
(3, 'User')
ON DUPLICATE KEY UPDATE group_name = VALUES(group_name);

-- Insert default rules
INSERT INTO user_rules (rules_id, rules) VALUES
(1, 'users.view'),
(2, 'users.create'),
(3, 'users.update'),
(4, 'users.delete'),
(5, 'products.view'),
(6, 'products.create'),
(7, 'products.update'),
(8, 'products.delete'),
(9, 'orders.view'),
(10, 'orders.manage')
ON DUPLICATE KEY UPDATE rules = VALUES(rules);

-- Assign rules to groups
-- Super Admin gets all rules
INSERT INTO user_group_rules (group_id, rules_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10)
ON DUPLICATE KEY UPDATE group_id = VALUES(group_id);

-- Admin gets most rules except user management
INSERT INTO user_group_rules (group_id, rules_id) VALUES
(2, 1), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10)
ON DUPLICATE KEY UPDATE group_id = VALUES(group_id);

-- Regular users get limited rules
INSERT INTO user_group_rules (group_id, rules_id) VALUES
(3, 1), (3, 5), (3, 9)
ON DUPLICATE KEY UPDATE group_id = VALUES(group_id);

-- Create a default admin user (password: admin123)
-- You should change this in production!
INSERT INTO user (name, email, password, level, created_at, is_verified) VALUES
('Admin User', 'admin@tokopaedi.com', '$2b$10$rKvHjF8H9fXDHq.v0qM0qOzGJHZQNjCKzFGfKZqZXYZQNjCKzFGfK', 1, UNIX_TIMESTAMP(), 1)
ON DUPLICATE KEY UPDATE email = VALUES(email);
