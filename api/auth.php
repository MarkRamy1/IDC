<?php
require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';
$input = get_json_input();

function normalize_phone($p) {
    if (!$p) return '';
    $p = trim($p);
    if (strpos($p, '+20') === 0) {
        return '0' . substr($p, 3);
    }
    return $p;
}

switch ($action) {
    case 'signup':
        $email = strtolower(trim($input['email'] ?? ''));
        $password = $input['password'] ?? '';
        $fullName = trim($input['options']['data']['full_name'] ?? $input['full_name'] ?? '');

        if (!$fullName) json_res(['data' => null, 'error' => ['message' => 'الاسم مطلوب']]);
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) json_res(['data' => null, 'error' => ['message' => 'البريد الإلكتروني غير صحيح']]);
        if (strlen($password) < 8) json_res(['data' => null, 'error' => ['message' => 'كلمة المرور يجب أن لا تقل عن 8 أحرف']]);

        // Check existing user
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            json_res(['data' => null, 'error' => ['message' => 'هذا البريد الإلكتروني مسجل بالفعل']]);
        }

        $userId = guidv4();
        $pwHash = password_hash($password, PASSWORD_BCRYPT);
        $handle = 'u' . substr(md5(random_bytes(16) . $userId), 0, 8);

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)");
            $stmt->execute([$userId, $email, $pwHash]);

            $stmt = $pdo->prepare("INSERT INTO profiles (id, full_name, handle) VALUES (?, ?, ?)");
            $stmt->execute([$userId, $fullName, $handle]);

            $stmt = $pdo->prepare("INSERT INTO profile_private (id) VALUES (?)");
            $stmt->execute([$userId]);

            // Create session
            $token = bin2hex(random_bytes(32));
            $stmt = $pdo->prepare("INSERT INTO sessions (token, user_id, aal, expires_at) VALUES (?, ?, 'aal1', DATE_ADD(NOW(), INTERVAL 30 DAY))");
            $stmt->execute([$token, $userId]);

            $pdo->commit();

            $userObj = [
                'id' => $userId,
                'email' => $email,
                'phone' => null,
                'user_metadata' => ['full_name' => $fullName]
            ];

            json_res([
                'data' => [
                    'user' => $userObj,
                    'session' => [
                        'access_token' => $token,
                        'user' => $userObj
                    ]
                ],
                'error' => null
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            json_res(['data' => null, 'error' => ['message' => $e->getMessage()]]);
        }
        break;

    case 'login':
        $login = trim($input['email'] ?? $input['phone'] ?? $input['lg'] ?? '');
        $password = $input['password'] ?? $input['lp'] ?? '';

        if (!$login || !$password) {
            json_res(['data' => null, 'error' => ['message' => 'يرجى كتابة البريد وكلمة المرور']]);
        }

        $isPhone = preg_match('/^01\d{9}$/', $login) || preg_match('/^\+201\d{9}$/', $login);
        if ($isPhone) {
            $norm = normalize_phone($login);
            $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = ? OR phone = ?");
            $stmt->execute([$norm, '+20' . substr($norm, 1)]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([strtolower($login)]);
        }

        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            json_res(['data' => null, 'error' => ['message' => 'بيانات الدخول غير صحيحة']]);
        }

        $token = bin2hex(random_bytes(32));
        $stmt = $pdo->prepare("INSERT INTO sessions (token, user_id, aal, expires_at) VALUES (?, ?, 'aal1', DATE_ADD(NOW(), INTERVAL 30 DAY))");
        $stmt->execute([$token, $user['id']]);

        // Get full name
        $stmt = $pdo->prepare("SELECT full_name FROM profiles WHERE id = ?");
        $stmt->execute([$user['id']]);
        $prof = $stmt->fetch();

        $userObj = [
            'id' => $user['id'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'user_metadata' => ['full_name' => $prof['full_name'] ?? '']
        ];

        json_res([
            'data' => [
                'user' => $userObj,
                'session' => [
                    'access_token' => $token,
                    'user' => $userObj
                ]
            ],
            'error' => null
        ]);
        break;

    case 'update_user':
        $user = auth_user($pdo, true);
        $phone = $input['phone'] ?? null;
        $password = $input['password'] ?? null;

        if ($phone !== null) {
            $norm = normalize_phone($phone);
            // Generate OTP code
            $code = str_pad(strval(random_int(100000, 999999)), 6, '0', STR_PAD_LEFT);
            $stmt = $pdo->prepare("INSERT INTO otps (phone, code, type, expires_at) VALUES (?, ?, 'phone_change', DATE_ADD(NOW(), INTERVAL 15 MINUTE))");
            $stmt->execute([$norm, $code]);

            // Save phone to profile_private temporarily
            $stmt = $pdo->prepare("UPDATE profile_private SET phone = ? WHERE id = ?");
            $stmt->execute([$norm, $user['id']]);

            json_res([
                'data' => [
                    'user' => array_merge($user, ['phone' => $norm]),
                    'debug_otp' => $code
                ],
                'error' => null
            ]);
        }

        if ($password !== null) {
            if (strlen($password) < 8) {
                json_res(['data' => null, 'error' => ['message' => 'كلمة المرور يجب أن لا تقل عن 8 أحرف']]);
            }
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $stmt->execute([$hash, $user['id']]);

            json_res(['data' => ['user' => $user], 'error' => null]);
        }

        json_res(['data' => ['user' => $user], 'error' => null]);
        break;

    case 'verify_otp':
        $phone = normalize_phone($input['phone'] ?? '');
        $token = trim($input['token'] ?? '');
        $type = $input['type'] ?? 'sms';

        // Check if code matches (accept generated code or 123456 as master fallback)
        $stmt = $pdo->prepare("SELECT id FROM otps WHERE phone = ? AND code = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1");
        $stmt->execute([$phone, $token]);
        $found = $stmt->fetch();

        if (!$found && $token !== '123456') {
            json_res(['data' => null, 'error' => ['message' => 'رمز التحقق غير صحيح أو منتهي الصلاحية']]);
        }

        // Clean up OTP
        if ($found) {
            $stmt = $pdo->prepare("DELETE FROM otps WHERE id = ?");
            $stmt->execute([$found['id']]);
        }

        // If phone_change, update users table
        $user = auth_user($pdo, false);
        if ($user && $phone) {
            $stmt = $pdo->prepare("UPDATE users SET phone = ? WHERE id = ?");
            $stmt->execute([$phone, $user['id']]);
            $stmt = $pdo->prepare("UPDATE profile_private SET phone = ? WHERE id = ?");
            $stmt->execute([$phone, $user['id']]);
            $user['phone'] = $phone;
        }

        json_res(['data' => ['user' => $user], 'error' => null]);
        break;

    case 'send_otp':
    case 'forgot':
        $phone = normalize_phone($input['phone'] ?? '');
        $code = str_pad(strval(random_int(100000, 999999)), 6, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare("INSERT INTO otps (phone, code, type, expires_at) VALUES (?, ?, 'sms', DATE_ADD(NOW(), INTERVAL 15 MINUTE))");
        $stmt->execute([$phone, $code]);

        json_res([
            'data' => ['sent' => true, 'debug_otp' => $code],
            'error' => null
        ]);
        break;

    case 'me':
        $user = auth_user($pdo, true);
        $stmt = $pdo->prepare("SELECT full_name FROM profiles WHERE id = ?");
        $stmt->execute([$user['id']]);
        $p = $stmt->fetch();
        json_res([
            'data' => [
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'phone' => $user['phone'],
                    'user_metadata' => ['full_name' => $p['full_name'] ?? '']
                ]
            ],
            'error' => null
        ]);
        break;

    case 'session':
        $user = auth_user($pdo, false);
        if (!$user) {
            json_res(['data' => ['session' => null], 'error' => null]);
        }
        json_res([
            'data' => [
                'session' => [
                    'access_token' => $user['token'],
                    'user' => $user
                ]
            ],
            'error' => null
        ]);
        break;

    case 'logout':
        $token = get_bearer_token();
        if ($token) {
            $stmt = $pdo->prepare("DELETE FROM sessions WHERE token = ?");
            $stmt->execute([$token]);
        }
        json_res(['data' => null, 'error' => null]);
        break;

    default:
        json_err('Unknown auth action');
}
