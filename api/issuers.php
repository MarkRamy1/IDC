<?php
require_once __DIR__ . '/db.php';

$stmt = $pdo->query("SELECT id, name, name_en, verified FROM issuers ORDER BY name ASC");
$rows = $stmt->fetchAll();

foreach ($rows as &$r) {
    $r['verified'] = (bool)$r['verified'];
}

json_res(['data' => $rows, 'error' => null]);
