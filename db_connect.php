<?php
declare(strict_types=1);
/**
 * Minimal DB connection helper for local XAMPP usage.
 * Update credentials if your MySQL setup differs.
 */
function gtbs_pdo(): PDO
{
  static $pdo = null;
  if ($pdo instanceof PDO) {
    return $pdo;
  }
  // 127.0.0.1 is usually faster/more reliable than localhost on Windows.
  $host = '127.0.0.1';
  $db   = 'gtbs';
  $user = 'root';
  $pass = '';
  $charset = 'utf8mb4';

  // One-time schema bootstrap marker to avoid running DDL on every request.
  $schemaMarker = __DIR__ . '/.schema_initialized';
  $needsBootstrap = !is_file($schemaMarker);

  if ($needsBootstrap) {
    // Connect once without selecting a database so we can CREATE it.
    $dsnNoDb = "mysql:host={$host};charset={$charset}";
    $pdoNoDb = new PDO($dsnNoDb, $user, $pass, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_TIMEOUT => 5,
    ]);

    $pdoNoDb->exec(
      "CREATE DATABASE IF NOT EXISTS `{$db}`
       CHARACTER SET {$charset}
       COLLATE utf8mb4_unicode_ci"
    );
  }

  $dsn = "mysql:host={$host};dbname={$db};charset={$charset}";
  $pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_TIMEOUT => 5,
  ]);

  // If the marker exists but tables are missing (e.g. DB was dropped),
  // re-run bootstrap to keep the app self-healing.
  try {
    $hasUsers = (bool)$pdo->query("SHOW TABLES LIKE 'users'")->fetchColumn();
    $hasBookings = (bool)$pdo->query("SHOW TABLES LIKE 'bookings'")->fetchColumn();
    if (!$hasUsers || !$hasBookings) {
      $needsBootstrap = true;
    }
  } catch (Throwable) {
    $needsBootstrap = true;
  }

  if ($needsBootstrap) {
    // Create schema only once on fresh setup.
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin','user') NOT NULL DEFAULT 'user',
        joined_display VARCHAR(64) NOT NULL,
        joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    ");

    $pdo->exec("
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
    ");

    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bookings_user_created ON bookings(user_id, created_at);");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);");
    @file_put_contents($schemaMarker, date('c'));
  }

  return $pdo;
}

