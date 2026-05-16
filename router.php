<?php
declare(strict_types=1);

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$path = __DIR__ . $uri;

if ($uri !== '/' && is_file($path)) {
  return false;
}

if ($uri === '/api.php' || str_ends_with($uri, '/api.php')) {
  require __DIR__ . '/api.php';
  return true;
}

return false;
