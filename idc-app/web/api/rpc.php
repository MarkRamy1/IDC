<?php
require_once __DIR__ . '/db.php';

$fn = $_GET['fn'] ?? '';
$input = get_json_input();

if ($fn === 'get_public_profile') {
    $h = trim($input['h'] ?? $_GET['h'] ?? '');
    if (!$h) json_res(['data' => null, 'error' => null]);

    $stmt = $pdo->prepare("SELECT id, full_name, governorate, role FROM profiles WHERE handle = ?");
    $stmt->execute([$h]);
    $profile = $stmt->fetch();
    if (!$profile) json_res(['data' => null, 'error' => null]);

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
}

// Authenticated RPC functions
$user = auth_user($pdo, true);

switch ($fn) {
    case 'vault_status':
        $stmt = $pdo->prepare("SELECT pw_hash, failed, locked_until FROM vault_credentials WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $cred = $stmt->fetch();
        $open = is_vault_open($pdo, $user['id']);
        $lockedUntil = null;
        if ($cred && $cred['locked_until']) {
            if (strtotime($cred['locked_until']) > time()) {
                $lockedUntil = $cred['locked_until'];
            }
        }
        json_res([
            'data' => [
                'has_vault' => (bool)$cred,
                'open' => (bool)$open,
                'locked_until' => $lockedUntil
            ],
            'error' => null
        ]);
        break;

    case 'set_vault_password':
        $pw = $input['pw'] ?? '';
        $oldPw = $input['old_pw'] ?? null;

        if (strlen($pw) < 8 || !preg_match('/[0-9]/', $pw) || !preg_match('/[\p{L}]/u', $pw)) {
            json_res(['data' => 'weak', 'error' => null]);
        }

        $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $acc = $stmt->fetch();
        if ($acc && password_verify($pw, $acc['password_hash'])) {
            json_res(['data' => 'same_as_account', 'error' => null]);
        }

        $stmt = $pdo->prepare("SELECT * FROM vault_credentials WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $existing = $stmt->fetch();

        if ($existing) {
            if (!$oldPw || !password_verify($oldPw, $existing['pw_hash'])) {
                json_res(['data' => 'wrong_old', 'error' => null]);
            }
        }

        $hash = password_hash($pw, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("
            INSERT INTO vault_credentials (user_id, pw_hash, failed, locked_until, updated_at)
            VALUES (?, ?, 0, NULL, NOW())
            ON DUPLICATE KEY UPDATE pw_hash = VALUES(pw_hash), failed = 0, locked_until = NULL, updated_at = NOW()
        ");
        $stmt->execute([$user['id'], $hash]);
        json_res(['data' => 'ok', 'error' => null]);
        break;

    case 'unlock_vault':
        $pw = $input['pw'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM vault_credentials WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $c = $stmt->fetch();

        if (!$c) {
            json_res(['data' => 'no_vault', 'error' => null]);
        }

        if ($c['locked_until'] && strtotime($c['locked_until']) > time()) {
            log_access($pdo, $user['id'], 'unlock_locked', false);
            json_res(['data' => 'locked', 'error' => null]);
        }

        if (password_verify($pw, $c['pw_hash'])) {
            $stmt = $pdo->prepare("UPDATE vault_credentials SET failed = 0, locked_until = NULL WHERE user_id = ?");
            $stmt->execute([$user['id']]);

            $stmt = $pdo->prepare("
                INSERT INTO vault_sessions (user_id, expires_at)
                VALUES (?, DATE_ADD(NOW(), INTERVAL 2 MINUTE))
                ON DUPLICATE KEY UPDATE expires_at = DATE_ADD(NOW(), INTERVAL 2 MINUTE)
            ");
            $stmt->execute([$user['id']]);

            log_access($pdo, $user['id'], 'unlock', true);
            json_res(['data' => 'ok', 'error' => null]);
        }

        $failed = $c['failed'] + 1;
        if ($failed >= 3) {
            $stmt = $pdo->prepare("UPDATE vault_credentials SET failed = 0, locked_until = DATE_ADD(NOW(), INTERVAL 60 SECOND) WHERE user_id = ?");
            $stmt->execute([$user['id']]);
        } else {
            $stmt = $pdo->prepare("UPDATE vault_credentials SET failed = ? WHERE user_id = ?");
            $stmt->execute([$failed, $user['id']]);
        }

        log_access($pdo, $user['id'], 'unlock', false);
        json_res(['data' => 'wrong', 'error' => null]);
        break;

    case 'lock_vault':
        $stmt = $pdo->prepare("DELETE FROM vault_sessions WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        json_res(['data' => null, 'error' => null]);
        break;

    case 'touch_vault':
        $stmt = $pdo->prepare("
            UPDATE vault_sessions
            SET expires_at = DATE_ADD(NOW(), INTERVAL 2 MINUTE)
            WHERE user_id = ? AND expires_at > NOW()
        ");
        $stmt->execute([$user['id']]);
        json_res(['data' => null, 'error' => null]);
        break;

    default:
        json_err("RPC function '$fn' not found", 404);
}
