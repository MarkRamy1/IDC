<?php
// IDC Database Connection & Helper Functions
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_reporting(E_ALL);
ini_set('display_errors', '0');

$DB_HOST = '127.0.0.1';
$DB_NAME = 'idc';
$DB_USER = 'root';
$DB_PASS = '';

try {
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

function json_res($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_err($message, $code = 400) {
    json_res(['error' => $message], $code);
}

function get_json_input() {
    $raw = file_get_contents('php://input');
    if (!$raw) return $_POST;
    $parsed = json_decode($raw, true);
    return is_array($parsed) ? array_merge($_POST, $parsed) : $_POST;
}

function guidv4() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function get_bearer_token() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    if ($headers && preg_match('/Bearer\s+(\S+)/i', $headers, $matches)) {
        return $matches[1];
    }
    return $_REQUEST['token'] ?? null;
}

function auth_user($pdo, $required = true) {
    $token = get_bearer_token();
    if (!$token) {
        if ($required) json_err('Unauthenticated', 401);
        return null;
    }

    $stmt = $pdo->prepare("
        SELECT s.token, s.aal, s.user_id, u.email, u.phone
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > NOW()
    ");
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        if ($required) json_err('Invalid or expired session', 401);
        return null;
    }

    return [
        'id' => $user['user_id'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'aal' => $user['aal'],
        'token' => $user['token']
    ];
}

function is_vault_open($pdo, $user_id) {
    $stmt = $pdo->prepare("SELECT expires_at FROM vault_sessions WHERE user_id = ? AND expires_at > NOW()");
    $stmt->execute([$user_id]);
    return (bool)$stmt->fetch();
}

function log_access($pdo, $user_id, $action, $ok) {
    try {
        $stmt = $pdo->prepare("INSERT INTO access_logs (user_id, action, ok, at) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$user_id, $action, $ok ? 1 : 0]);
    } catch (Exception $e) {}
}
