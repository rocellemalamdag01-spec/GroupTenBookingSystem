<?php
declare(strict_types=1);

ini_set('display_errors', '0'); // keep responses valid JSON
error_reporting(E_ALL);

require_once __DIR__ . '/db_connect.php';

header('Content-Type: application/json; charset=utf-8');

function respond(bool $ok, mixed $data = null, ?string $error = null): void
{
  echo json_encode(
    $ok
      ? ['ok' => true, 'data' => $data]
      : ['ok' => false, 'error' => $error ?? 'Unknown error'],
    JSON_UNESCAPED_UNICODE
  );
  exit;
}

function input_json(): array
{
  $raw = file_get_contents('php://input');
  if ($raw === false || $raw === '') return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}


function ensure_admin_exists(PDO $pdo): void
{
  $adminEmail = 'admin@cebuparadise.com';
  $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
  $stmt->execute([$adminEmail]);
  $id = $stmt->fetchColumn();
  if ($id) return;

  $adminPassword = 'admin123';
  $hash = password_hash($adminPassword, PASSWORD_DEFAULT);
  $joinedDisplay = date('M j, Y');
  $insert = $pdo->prepare('
    INSERT INTO users (id, name, email, password_hash, role, joined_display)
    VALUES (?, ?, ?, ?, \'admin\', ?)
  ');
  $insert->execute(['admin_001', 'Admin', $adminEmail, $hash, $joinedDisplay]);
}

function to_date_str(?string $value): ?string
{
  if (!$value) return null;
  // Expecting YYYY-MM-DD from <input type="date">
  // Convert safely and return normalized YYYY-MM-DD.
  try {
    $dt = new DateTime($value);
    return $dt->format('Y-m-d');
  } catch (Throwable) {
    return null;
  }
}

$payload = null;
$action = null;

try {
  $payload = input_json();
  $action = $payload['action'] ?? null;

  if (!$action) {
    respond(false, null, 'Missing action');
  }

  $pdo = gtbs_pdo();
  ensure_admin_exists($pdo);

  switch ($action) {
    case 'auth_login': {
      $email = trim((string)($payload['email'] ?? ''));
      $password = (string)($payload['password'] ?? '');

      if (!$email || !$password) {
        respond(false, null, 'Please enter your email and password.');
      }

      $stmt = $pdo->prepare('SELECT id, name, email, password_hash, role, joined_display FROM users WHERE email = ? LIMIT 1');
      $stmt->execute([$email]);
      $user = $stmt->fetch();
      if (!$user || !password_verify($password, $user['password_hash'])) {
        respond(false, null, 'Invalid email or password.');
      }

      respond(true, [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'joined' => $user['joined_display'],
      ]);
    }

    case 'auth_register': {
      $name = trim((string)($payload['name'] ?? ''));
      $email = trim((string)($payload['email'] ?? ''));
      $password = (string)($payload['password'] ?? '');

      if (!$name) respond(false, null, 'Please enter your full name.');
      if (!$email || strpos($email, '@') === false) respond(false, null, 'Please enter a valid email address.');
      if (strlen($password) < 6) respond(false, null, 'Password must be at least 6 characters.');

      $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
      $stmt->execute([$email]);
      if ($stmt->fetchColumn()) {
        respond(false, null, 'An account with that email already exists.');
      }

      $id = 'usr_' . time() . '_' . bin2hex(random_bytes(3));
      $hash = password_hash($password, PASSWORD_DEFAULT);
      $joinedDisplay = date('M j, Y');

      $insert = $pdo->prepare('
        INSERT INTO users (id, name, email, password_hash, role, joined_display)
        VALUES (?, ?, ?, ?, \'user\', ?)
      ');
      $insert->execute([$id, $name, $email, $hash, $joinedDisplay]);

      respond(true, [
        'id' => $id,
        'name' => $name,
        'email' => $email,
        'role' => 'user',
        'joined' => $joinedDisplay,
      ]);
    }

    case 'users_list': {
      $stmt = $pdo->query('
        SELECT
          u.id, u.name, u.email, u.role, u.joined_display,
          COUNT(b.id) AS bookingCount
        FROM users u
        LEFT JOIN bookings b ON b.user_id = u.id
        GROUP BY u.id
        ORDER BY u.joined_at DESC
      ');

      $rows = $stmt->fetchAll();
      $out = array_map(fn($u) => [
        'id' => $u['id'],
        'name' => $u['name'],
        'email' => $u['email'],
        'role' => $u['role'],
        'joined' => $u['joined_display'],
        'bookingCount' => (int)$u['bookingCount'],
      ], $rows);
      respond(true, $out);
    }

    case 'bookings_list': {
      $userId = (string)($payload['userId'] ?? '');
      if (!$userId) respond(false, null, 'Missing userId.');

      $stmt = $pdo->prepare('
        SELECT
          b.id,
          b.ref,
          b.spot_id,
          b.spot_name,
          b.spot_img,
          b.traveler_name,
          b.traveler_email,
          b.guests,
          b.checkin,
          b.checkout,
          b.nights,
          b.accommodation,
          b.notes,
          b.pay_method,
          b.pay_summary,
          b.status,
          b.created_display
        FROM bookings b
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      ');
      $stmt->execute([$userId]);
      $rows = $stmt->fetchAll();

      $out = array_map(function ($b) {
        return [
          'id' => (int)$b['id'],
          'ref' => (string)$b['ref'],
          'spotId' => (int)$b['spot_id'],
          'spotName' => (string)$b['spot_name'],
          'spotImg' => (string)$b['spot_img'],
          'name' => (string)$b['traveler_name'],
          'email' => (string)$b['traveler_email'],
          'checkin' => (string)$b['checkin'],
          'checkout' => (string)$b['checkout'],
          'guests' => (string)$b['guests'],
          'accomm' => (string)$b['accommodation'],
          'notes' => $b['notes'] ?? '',
          'nights' => (int)$b['nights'],
          'payMethod' => (string)$b['pay_method'],
          'paySummary' => $b['pay_summary'] ?? '',
          'status' => (string)$b['status'],
          'created' => (string)$b['created_display'],
        ];
      }, $rows);

      respond(true, $out);
    }

    case 'bookings_create': {
      $userId = (string)($payload['userId'] ?? '');
      $booking = $payload['booking'] ?? null;
      if (!$userId || !is_array($booking)) respond(false, null, 'Invalid create payload.');

      $id = isset($booking['id']) ? (int)$booking['id'] : (int)(microtime(true) * 100000);
      $ref = (string)($booking['ref'] ?? '');
      if (!$ref) respond(false, null, 'Missing booking ref.');

      $checkin = to_date_str((string)($booking['checkin'] ?? ''));
      $checkout = to_date_str((string)($booking['checkout'] ?? ''));
      if (!$checkin || !$checkout) respond(false, null, 'Invalid booking dates.');

      $stmt = $pdo->prepare('SELECT id FROM users WHERE id = ? LIMIT 1');
      $stmt->execute([$userId]);
      if (!$stmt->fetchColumn()) respond(false, null, 'User not found.');

      $createdDisplay = (string)($booking['created'] ?? date('M j, Y'));

      $insert = $pdo->prepare('
        INSERT INTO bookings (
          id, user_id, ref,
          spot_id, spot_name, spot_img,
          traveler_name, traveler_email,
          guests, checkin, checkout, nights,
          accommodation, notes,
          pay_method, pay_summary,
          status,
          created_display
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ');

      $insert->execute([
        $id,
        $userId,
        $ref,
        (int)($booking['spotId'] ?? 0),
        (string)($booking['spotName'] ?? ''),
        (string)($booking['spotImg'] ?? ''),
        (string)($booking['name'] ?? ''),
        (string)($booking['email'] ?? ''),
        (string)($booking['guests'] ?? ''),
        $checkin,
        $checkout,
        (int)($booking['nights'] ?? 0),
        (string)($booking['accomm'] ?? ''),
        (string)($booking['notes'] ?? ''),
        (string)($booking['payMethod'] ?? ''),
        (string)($booking['paySummary'] ?? ''),
        'confirmed',
        $createdDisplay
      ]);

      respond(true, ['id' => $id, 'ref' => $ref]);
    }

    case 'bookings_cancel': {
      $userId = (string)($payload['userId'] ?? '');
      $bookingId = isset($payload['bookingId']) ? (int)$payload['bookingId'] : 0;
      if (!$userId || !$bookingId) respond(false, null, 'Invalid cancel payload.');

      $stmt = $pdo->prepare('
        UPDATE bookings
        SET status = \'cancelled\', updated_at = NOW()
        WHERE id = ? AND user_id = ?
      ');
      $stmt->execute([$bookingId, $userId]);
      if ($stmt->rowCount() === 0) {
        respond(false, null, 'Booking not found.');
      }
      respond(true, ['id' => $bookingId]);
    }

    case 'migrate_localstorage': {
      $users = $payload['users'] ?? [];
      $bookingsByUserId = $payload['bookingsByUserId'] ?? [];
      if (!is_array($users) || !is_array($bookingsByUserId)) {
        respond(false, null, 'Invalid migration payload.');
      }

      $pdo->beginTransaction();

      $userIdMap = []; // oldUserId => newUserId (email-based)

      // 1) Users
      foreach ($users as $u) {
        if (!is_array($u)) continue;

        $oldId = (string)($u['id'] ?? '');
        $email = strtolower(trim((string)($u['email'] ?? '')));
        $name = trim((string)($u['name'] ?? ''));
        $role = (string)($u['role'] ?? 'user');
        $joined = (string)($u['joined'] ?? date('M j, Y'));
        $passwordPlain = (string)($u['password'] ?? '');

        if (!$oldId || !$email || !$name) continue;
        if (!in_array($role, ['admin', 'user'], true)) $role = 'user';

        if (!$passwordPlain) {
          // Keep password requirement for migration; app stores it in localStorage.
          respond(false, null, 'Migration failed: missing password for user ' . $email);
        }

        $hash = password_hash($passwordPlain, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $existingId = $stmt->fetchColumn();

        if ($existingId) {
          $userIdMap[$oldId] = (string)$existingId;
          $upd = $pdo->prepare('
            UPDATE users
            SET name = ?, role = ?, password_hash = ?, joined_display = ?
            WHERE id = ?
          ');
          $upd->execute([$name, $role, $hash, $joined, $existingId]);
        } else {
          // Preserve old id so existing booking.user_id references still match.
          $ins = $pdo->prepare('
            INSERT INTO users (id, name, email, password_hash, role, joined_display)
            VALUES (?, ?, ?, ?, ?, ?)
          ');
          $ins->execute([$oldId, $name, $email, $hash, $role, $joined]);
          $userIdMap[$oldId] = $oldId;
        }
      }

      // 2) Bookings
      foreach ($bookingsByUserId as $oldUserId => $list) {
        $oldUserId = (string)$oldUserId;
        if (!isset($userIdMap[$oldUserId])) continue;
        $mappedUserId = $userIdMap[$oldUserId];

        if (!is_array($list)) continue;

        foreach ($list as $b) {
          if (!is_array($b)) continue;

          $id = isset($b['id']) ? (int)$b['id'] : null;
          $ref = (string)($b['ref'] ?? '');
          if (!$id || !$ref) continue;

          $checkin = to_date_str((string)($b['checkin'] ?? ''));
          $checkout = to_date_str((string)($b['checkout'] ?? ''));
          if (!$checkin || !$checkout) continue;

          $stmt = $pdo->prepare('
            INSERT IGNORE INTO bookings (
              id, user_id, ref,
              spot_id, spot_name, spot_img,
              traveler_name, traveler_email,
              guests, checkin, checkout, nights,
              accommodation, notes,
              pay_method, pay_summary,
              status,
              created_display
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ');

          $status = (string)($b['status'] ?? 'confirmed');
          if (!in_array($status, ['confirmed', 'cancelled'], true)) $status = 'confirmed';

          $stmt->execute([
            $id,
            $mappedUserId,
            $ref,
            (int)($b['spotId'] ?? 0),
            (string)($b['spotName'] ?? ''),
            (string)($b['spotImg'] ?? ''),
            (string)($b['name'] ?? ''),
            (string)($b['email'] ?? ''),
            (string)($b['guests'] ?? ''),
            $checkin,
            $checkout,
            (int)($b['nights'] ?? 0),
            (string)($b['accomm'] ?? ''),
            (string)($b['notes'] ?? ''),
            (string)($b['payMethod'] ?? ''),
            (string)($b['paySummary'] ?? ''),
            $status,
            (string)($b['created'] ?? date('M j, Y')),
          ]);
        }
      }

      $pdo->commit();
      respond(true, ['migrated' => true]);
    }

    default:
      respond(false, null, 'Unknown action: ' . (string)$action);
  }
} catch (Throwable $e) {
  respond(false, null, 'Server error: ' . $e->getMessage());
}