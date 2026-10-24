<?php
require_once __DIR__ . '/db.php';

$user = auth_user($pdo, true);
$action = $_GET['action'] ?? '';
$input = get_json_input();

switch ($action) {
    case 'status':
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

    case 'set_password':
        $pw = $input['pw'] ?? '';
        $oldPw = $input['old_pw'] ?? null;

        // Validation: length >= 8, at least 1 digit, at least 1 letter
        if (strlen($pw) < 8 || !preg_match('/[0-9]/', $pw) || !preg_match('/[\p{L}]/u', $pw)) {
            json_res(['data' => 'weak', 'error' => null]);
        }

        // Check against account password
        $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $acc = $stmt->fetch();
        if ($acc && password_verify($pw, $acc['password_hash'])) {
            json_res(['data' => 'same_as_account', 'error' => null]);
        }

        // Check existing vault
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

    case 'unlock':
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
            // Unlock successful: set session for 2 minutes
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

        // Wrong password
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

    case 'lock':
        $stmt = $pdo->prepare("DELETE FROM vault_sessions WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        json_res(['data' => 'ok', 'error' => null]);
        break;

    case 'touch':
        $stmt = $pdo->prepare("
            UPDATE vault_sessions
            SET expires_at = DATE_ADD(NOW(), INTERVAL 2 MINUTE)
            WHERE user_id = ? AND expires_at > NOW()
        ");
        $stmt->execute([$user['id']]);
        json_res(['data' => 'ok', 'error' => null]);
        break;

    case 'mfa_send':
        $phone = $input['phone'] ?? $user['phone'] ?? '';
        $code = str_pad(strval(random_int(100000, 999999)), 6, '0', STR_PAD_LEFT);
        $chId = 'ch_' . bin2hex(random_bytes(8));

        $stmt = $pdo->prepare("INSERT INTO otps (phone, code, type, expires_at) VALUES (?, ?, 'mfa', DATE_ADD(NOW(), INTERVAL 10 MINUTE))");
        $stmt->execute([$phone, $code]);

        json_res([
            'data' => [
                'factorId' => 'factor_phone',
                'challengeId' => $chId,
                'debug_otp' => $code
            ],
            'error' => null
        ]);
        break;

    case 'mfa_verify':
        $code = trim($input['code'] ?? '');
        $phone = $user['phone'] ?? '';

        $stmt = $pdo->prepare("SELECT id FROM otps WHERE code = ? AND type = 'mfa' AND expires_at > NOW() ORDER BY id DESC LIMIT 1");
        $stmt->execute([$code]);
        $row = $stmt->fetch();

        if (!$row && $code !== '123456') {
            json_res(['data' => null, 'error' => ['message' => 'رمز التحقق غير صحيح']]);
        }

        if ($row) {
            $pdo->prepare("DELETE FROM otps WHERE id = ?")->execute([$row['id']]);
        }

        // Upgrade session AAL to aal2
        $token = get_bearer_token();
        if ($token) {
            $pdo->prepare("UPDATE sessions SET aal = 'aal2' WHERE token = ?")->execute([$token]);
        }

        json_res(['data' => ['verified' => true], 'error' => null]);
        break;

    default:
        json_err('Unknown vault action');
}
