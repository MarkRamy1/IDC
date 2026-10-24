<?php
require_once __DIR__ . '/db.php';

$user = auth_user($pdo, true);
$method = $_SERVER['REQUEST_METHOD'];
$input = get_json_input();

if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM profiles WHERE id = ?");
    $stmt->execute([$user['id']]);
    $prof = $stmt->fetch() ?: [
        'id' => $user['id'],
        'full_name' => '',
        'handle' => 'u' . substr(md5($user['id']), 0, 8),
        'governorate' => null,
        'role' => 'student',
        'photo_path' => null,
        'onboarded' => 0
    ];

    $stmt = $pdo->prepare("SELECT * FROM profile_private WHERE id = ?");
    $stmt->execute([$user['id']]);
    $priv = $stmt->fetch() ?: [
        'national_id' => null,
        'birth_date' => null,
        'phone' => null
    ];

    $merged = array_merge($priv, $prof, [
        'id' => $user['id'],
        'email' => $user['email'],
        'auth_phone' => $user['phone'],
        'onboarded' => (bool)$prof['onboarded']
    ]);

    json_res(['data' => $merged, 'error' => null]);
}

if ($method === 'POST' || $method === 'PUT') {
    $isPrivate = isset($_GET['private']) || isset($input['national_id']) || isset($input['birth_date']);

    // Update profiles table if profile fields provided
    $fields = [];
    $params = [];

    if (isset($input['full_name'])) {
        $fields[] = "`full_name` = ?";
        $params[] = trim($input['full_name']);
    }
    if (array_key_exists('governorate', $input)) {
        $fields[] = "`governorate` = ?";
        $params[] = $input['governorate'] ?: null;
    }
    if (isset($input['role'])) {
        $fields[] = "`role` = ?";
        $params[] = $input['role'];
    }
    if (isset($input['photo_path'])) {
        $fields[] = "`photo_path` = ?";
        $params[] = $input['photo_path'];
    }
    if (isset($input['onboarded'])) {
        $fields[] = "`onboarded` = ?";
        $params[] = $input['onboarded'] ? 1 : 0;
    }

    if (!empty($fields)) {
        $params[] = $user['id'];
        $sql = "UPDATE profiles SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    // Update profile_private table
    $privFields = [];
    $privParams = [];
    if (array_key_exists('national_id', $input)) {
        $privFields[] = "`national_id` = ?";
        $privParams[] = $input['national_id'] ?: null;
    }
    if (array_key_exists('birth_date', $input)) {
        $privFields[] = "`birth_date` = ?";
        $privParams[] = $input['birth_date'] ?: null;
    }
    if (array_key_exists('phone', $input)) {
        $privFields[] = "`phone` = ?";
        $privParams[] = $input['phone'] ?: null;
    }

    if (!empty($privFields)) {
        $privParams[] = $user['id'];
        $sql = "UPDATE profile_private SET " . implode(', ', $privFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($privParams);
    }

    json_res(['data' => ['success' => true], 'error' => null]);
}

json_err('Method not allowed', 405);
