<?php
require_once __DIR__ . '/db.php';

$user = auth_user($pdo, true);
$method = $_SERVER['REQUEST_METHOD'];
$input = get_json_input();
$vaultOpen = is_vault_open($pdo, $user['id']);

if ($method === 'GET') {
    // If vault is open, return all items.
    // If vault is closed, return only effective public items.
    if ($vaultOpen) {
        $stmt = $pdo->prepare("
            SELECT i.*, s.name AS issuer_name, s.verified AS issuer_verified
            FROM items i
            LEFT JOIN issuers s ON s.id = i.issuer_id
            WHERE i.user_id = ?
            ORDER BY i.created_at DESC
        ");
        $stmt->execute([$user['id']]);
    } else {
        $stmt = $pdo->prepare("
            SELECT i.*, s.name AS issuer_name, s.verified AS issuer_verified
            FROM items i
            LEFT JOIN issuers s ON s.id = i.issuer_id
            WHERE i.user_id = ?
              AND (i.level = 'public' OR (i.level = 'secret' AND i.secret_until IS NOT NULL AND i.secret_until <= NOW()))
            ORDER BY i.created_at DESC
        ");
        $stmt->execute([$user['id']]);
    }

    $raw = $stmt->fetchAll();
    $items = [];
    foreach ($raw as $row) {
        $iss = null;
        if ($row['issuer_name']) {
            $iss = [
                'name' => $row['issuer_name'],
                'verified' => (bool)$row['issuer_verified']
            ];
        }
        $row['issuers'] = $iss;
        $row['on_card'] = (bool)$row['on_card'];
        unset($row['issuer_name'], $row['issuer_verified']);
        $items[] = $row;
    }

    json_res(['data' => $items, 'error' => null]);
}

if ($method === 'POST') {
    $level = $input['level'] ?? 'public';
    if ($level !== 'public' && !$vaultOpen) {
        json_res(['data' => null, 'error' => ['message' => 'الخزنة مقفلة. يرجى فتح القسم الخاص أولًا']]);
    }

    $id = guidv4();
    $type = $input['type'] ?? 'other';
    $title = trim($input['title'] ?? '');
    $value = $input['value'] ?? null;
    $issuerId = $input['issuer_id'] ?: null;
    $issuerText = $input['issuer_text'] ?: null;
    $secretUntil = $input['secret_until'] ?: null;
    $onCard = !empty($input['on_card']) ? 1 : 0;
    $filePath = $input['file_path'] ?? null;
    $fileName = $input['file_name'] ?? null;
    $fileKind = $input['file_kind'] ?? null;

    if (!$title) {
        json_res(['data' => null, 'error' => ['message' => 'العنوان مطلوب']]);
    }

    $stmt = $pdo->prepare("
        INSERT INTO items (id, user_id, level, type, title, value, issuer_id, issuer_text, secret_until, on_card, file_path, file_name, file_kind, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$id, $user['id'], $level, $type, $title, $value, $issuerId, $issuerText, $secretUntil, $onCard, $filePath, $fileName, $fileKind]);

    // Fetch newly created item
    $stmt = $pdo->prepare("
        SELECT i.*, s.name AS issuer_name, s.verified AS issuer_verified
        FROM items i
        LEFT JOIN issuers s ON s.id = i.issuer_id
        WHERE i.id = ?
    ");
    $stmt->execute([$id]);
    $created = $stmt->fetch();
    $created['issuers'] = $created['issuer_name'] ? ['name' => $created['issuer_name'], 'verified' => (bool)$created['issuer_verified']] : null;
    $created['on_card'] = (bool)$created['on_card'];
    unset($created['issuer_name'], $created['issuer_verified']);

    json_res(['data' => $created, 'error' => null]);
}

if ($method === 'PUT') {
    $id = $_GET['id'] ?? $input['id'] ?? null;
    if (!$id) json_res(['data' => null, 'error' => ['message' => 'معرف الوثيقة مطلوب']]);

    // Check item exists and ownership
    $stmt = $pdo->prepare("SELECT * FROM items WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $user['id']]);
    $existing = $stmt->fetch();
    if (!$existing) json_res(['data' => null, 'error' => ['message' => 'الوثيقة غير موجودة']]);

    $newLevel = $input['level'] ?? $existing['level'];
    if (($existing['level'] !== 'public' || $newLevel !== 'public') && !$vaultOpen) {
        json_res(['data' => null, 'error' => ['message' => 'الخزنة مقفلة. يرجى فتح القسم الخاص أولًا']]);
    }

    $fields = [];
    $params = [];

    $updatable = ['type', 'title', 'value', 'level', 'issuer_id', 'issuer_text', 'secret_until', 'on_card', 'file_path', 'file_name', 'file_kind'];
    foreach ($updatable as $col) {
        if (array_key_exists($col, $input)) {
            $fields[] = "`$col` = ?";
            if ($col === 'on_card') {
                $params[] = !empty($input[$col]) ? 1 : 0;
            } elseif ($col === 'issuer_id' || $col === 'secret_until') {
                $params[] = $input[$col] ?: null;
            } else {
                $params[] = $input[$col];
            }
        }
    }

    if (!empty($fields)) {
        $params[] = $id;
        $params[] = $user['id'];
        $sql = "UPDATE items SET " . implode(', ', $fields) . " WHERE id = ? AND user_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    // Return updated row
    $stmt = $pdo->prepare("
        SELECT i.*, s.name AS issuer_name, s.verified AS issuer_verified
        FROM items i
        LEFT JOIN issuers s ON s.id = i.issuer_id
        WHERE i.id = ?
    ");
    $stmt->execute([$id]);
    $updated = $stmt->fetch();
    $updated['issuers'] = $updated['issuer_name'] ? ['name' => $updated['issuer_name'], 'verified' => (bool)$updated['issuer_verified']] : null;
    $updated['on_card'] = (bool)$updated['on_card'];
    unset($updated['issuer_name'], $updated['issuer_verified']);

    json_res(['data' => $updated, 'error' => null]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? $input['id'] ?? null;
    if (!$id) json_res(['data' => null, 'error' => ['message' => 'معرف الوثيقة مطلوب']]);

    $stmt = $pdo->prepare("SELECT level FROM items WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $user['id']]);
    $item = $stmt->fetch();
    if (!$item) json_res(['data' => null, 'error' => ['message' => 'الوثيقة غير موجودة']]);

    if ($item['level'] !== 'public' && !$vaultOpen) {
        json_res(['data' => null, 'error' => ['message' => 'الخزنة مقفلة. يرجى فتح القسم الخاص أولًا']]);
    }

    $stmt = $pdo->prepare("DELETE FROM items WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $user['id']]);

    json_res(['data' => ['success' => true], 'error' => null]);
}

json_err('Method not allowed', 405);
