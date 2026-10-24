<?php
require_once __DIR__ . '/db.php';

$user = auth_user($pdo, true);

$stmt = $pdo->prepare("SELECT * FROM access_logs WHERE user_id = ? ORDER BY at DESC LIMIT 10");
$stmt->execute([$user['id']]);
$rows = $stmt->fetchAll();

foreach ($rows as &$r) {
    $r['ok'] = (bool)$r['ok'];
}

json_res(['data' => $rows, 'error' => null]);
