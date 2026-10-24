<?php
require_once __DIR__ . '/db.php';

$bucket = $_GET['bucket'] ?? 'documents';
$path = $_GET['path'] ?? '';
$path = str_replace(['..', '\\'], ['', '/'], $path);
$path = ltrim($path, '/');

$baseUploadDir = __DIR__ . '/../uploads';
$filePath = $baseUploadDir . '/' . $bucket . '/' . $path;

if (!$path || !file_exists($filePath)) {
    http_response_code(404);
    echo "File not found";
    exit;
}

if ($bucket === 'avatars') {
    // Avatars can be served directly
    $mime = mime_content_type($filePath) ?: 'image/jpeg';
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
    exit;
}

// Documents require authentication & vault permissions
$user = auth_user($pdo, true);

// Verify user ownership of this document
$stmt = $pdo->prepare("SELECT level FROM items WHERE user_id = ? AND file_path = ?");
$stmt->execute([$user['id'], $path]);
$item = $stmt->fetch();

if (!$item) {
    http_response_code(403);
    echo "Access denied";
    exit;
}

// If item is private or secret, check vault
if ($item['level'] !== 'public') {
    if (!is_vault_open($pdo, $user['id'])) {
        http_response_code(403);
        echo "Vault is locked. Unlock vault to view this document.";
        exit;
    }
}

$mime = mime_content_type($filePath) ?: 'application/octet-stream';
header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($filePath));
header('Content-Disposition: inline; filename="' . basename($filePath) . '"');
readfile($filePath);
exit;
