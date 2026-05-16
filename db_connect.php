<?php
declare(strict_types=1);
/**
 * Database connection for local XAMPP and Railway (env-driven).
 * Set DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT in Railway,
 * or use the MYSQL* variables from a linked MySQL service.
 */

function gtbs_db_config(): array
{
  return [
    'host' => getenv('DB_HOST') ?: getenv('MYSQLHOST') ?: '127.0.0.1',
    'user' => getenv('DB_USER') ?: getenv('MYSQLUSER') ?: 'root',
    'pass' => getenv('DB_PASS') ?: getenv('MYSQLPASSWORD') ?: 'JiJxNUhPorwxKikAwulGOHnHiamZUWul',
    'name' => getenv('DB_NAME') ?: getenv('MYSQLDATABASE') ?: 'gtbs',
    'port' => (int)(getenv('DB_PORT') ?: getenv('MYSQLPORT') ?: '3306'),
  ];
}

function gtbs_is_local_db(array $cfg): bool
{
  $host = strtolower(trim($cfg['host']));
  return $host === '' || $host === 'localhost' || $host === '127.0.0.1';
}

function gtbs_pdo(): PDO
{
  static $pdo = null;
  if ($pdo instanceof PDO) {
    return $pdo;
  }

  $cfg = gtbs_db_config();
  $host = $cfg['host'];
  $db = $cfg['name'];
  $user = $cfg['user'];
  $pass = $cfg['pass'];
  $port = $cfg['port'];
  $charset = 'utf8mb4';

  $pdoOptions = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_TIMEOUT => 5,
  ];

  $schemaMarker = __DIR__ . '/.schema_initialized';
  $needsBootstrap = !is_file($schemaMarker);
  $isLocal = gtbs_is_local_db($cfg);

  if ($needsBootstrap && $isLocal) {
    $dsnNoDb = "mysql:host={$host};port={$port};charset={$charset}";
    $pdoNoDb = new PDO($dsnNoDb, $user, $pass, $pdoOptions);

    $pdoNoDb->exec(
      "CREATE DATABASE IF NOT EXISTS `{$db}`
       CHARACTER SET {$charset}
       COLLATE utf8mb4_unicode_ci"
    );
  }

  $dsn = "mysql:host={$host};port={$port};dbname={$db};charset={$charset}";
  try {
    $pdo = new PDO($dsn, $user, $pass, $pdoOptions);
  } catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
  }

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
