-- CebuParadise (GTBS) schema
-- Import this file in phpMyAdmin.

CREATE DATABASE IF NOT EXISTS gtbs
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gtbs;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  joined_display VARCHAR(64) NOT NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  ref VARCHAR(32) NOT NULL UNIQUE,

  spot_id INT NOT NULL,
  spot_name VARCHAR(200) NOT NULL,
  spot_img VARCHAR(255) NOT NULL,

  traveler_name VARCHAR(120) NOT NULL,
  traveler_email VARCHAR(255) NOT NULL,

  guests VARCHAR(32) NOT NULL,
  checkin DATE NOT NULL,
  checkout DATE NOT NULL,
  nights INT NOT NULL,

  accommodation VARCHAR(200) NOT NULL,
  notes TEXT NULL,

  pay_method VARCHAR(20) NOT NULL,
  pay_summary VARCHAR(255) NULL,

  status ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',

  created_display VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL,

  CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX IF NOT EXISTS idx_bookings_user_created
  ON bookings(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_bookings_user_status
  ON bookings(user_id, status);

