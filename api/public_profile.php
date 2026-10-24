<?php
require_once __DIR__ . '/db.php';

$h = trim($_GET['h'] ?? '');
if (!$h) {
    json_res(['data' => null, 'error' => null]);
}

$stmt = $pdo->prepare("SELECT id, full_name, governorate, role FROM profiles WHERE handle = ?");
$stmt->execute([$h]);
$profile = $stmt->fetch();

if (!$profile) {
    json_res(['data' => null, 'error' => null]);
}

// Fetch public items marked on_card = 1
$stmt = $pdo->prepare("
    SELECT i.type, i.title, i.value,
           COALESCE(s.name, i.issuer_text) AS issuer,
           COALESCE(s.verified, 0) AS verified
    FROM items i
    LEFT JOIN issuers s ON s.id = i.issuer_id
    WHERE i.user_id = ?
      AND i.on_card = 1
      AND (i.level = 'public' OR (i.level = 'secret' AND i.secret_until IS NOT NULL AND i.secret_until <= NOW()))
    ORDER BY i.created_at DESC
");
$stmt->execute([$profile['id']]);
$items = $stmt->fetchAll();

foreach ($items as &$it) {
    $it['verified'] = (bool)$it['verified'];
}

json_res([
    'data' => [
        'full_name' => $profile['full_name'],
        'governorate' => $profile['governorate'],
        'role' => $profile['role'],
        'items' => $items
    ],
    'error' => null
]);
