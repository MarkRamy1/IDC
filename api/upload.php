<?php
require_once __DIR__ . '/db.php';

$user = auth_user($pdo, true);
$action = $_GET['action'] ?? 'upload';

$baseUploadDir = __DIR__ . '/../uploads';

if ($action === 'upload') {
    $bucket = $_POST['bucket'] ?? $_GET['bucket'] ?? 'documents';
    $path = $_POST['path'] ?? $_GET['path'] ?? '';

    if (!in_array($bucket, ['avatars', 'documents'])) {
        json_err('Invalid storage bucket');
    }

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        // Check raw input if sent as binary
        $raw = file_get_contents('php://input');
        if (!empty($raw) && !empty($path)) {
            $dest = $baseUploadDir . '/' . $bucket . '/' . $path;
            $dir = dirname($dest);
            if (!is_dir($dir)) mkdir($dir, 0777, true);
            file_put_contents($dest, $raw);
            json_res(['data' => ['path' => $path], 'error' => null]);
        }
        json_err('No file uploaded or upload error');
    }

    $file = $_FILES['file'];
    if ($file['size'] > 5 * 1024 * 1024) {
        json_err('File size exceeds 5MB limit');
    }

    if (!$path) {
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $path = $user['id'] . '/' . uniqid() . '.' . $ext;
    }

    // Security: sanitize path against directory traversal
    $path = str_replace(['..', '\\'], ['', '/'], $path);
    $path = ltrim($path, '/');

    $targetFile = $baseUploadDir . '/' . $bucket . '/' . $path;
    $targetDir = dirname($targetFile);
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0777, true);
    }

    if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
        json_err('Failed to save uploaded file');
    }

    json_res(['data' => ['Key' => $bucket . '/' . $path, 'path' => $path], 'error' => null]);
}

if ($action === 'signed') {
    $bucket = $_GET['bucket'] ?? 'documents';
    $path = $_GET['path'] ?? '';
    $token = get_bearer_token();

    $signedUrl = '/idc/api/file.php?bucket=' . urlencode($bucket) . '&path=' . urlencode($path) . '&token=' . urlencode($token);
    json_res(['data' => ['signedUrl' => $signedUrl], 'error' => null]);
}

if ($action === 'delete') {
    $input = get_json_input();
    $bucket = $input['bucket'] ?? 'documents';
    $paths = $input['paths'] ?? [];

    foreach ($paths as $p) {
        $p = str_replace(['..', '\\'], ['', '/'], $p);
        $file = $baseUploadDir . '/' . $bucket . '/' . ltrim($p, '/');
        if (file_exists($file)) {
            unlink($file);
        }
    }

    json_res(['data' => ['success' => true], 'error' => null]);
}

json_err('Unknown upload action');
