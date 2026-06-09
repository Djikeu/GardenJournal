<?php

if (!defined('JWT_SECRET')) {
    define('JWT_SECRET', 'botanic-journal-CHANGE-ME-7f3a9c2e8b41d6a05e2c9');
}

function jwt_b64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function jwt_b64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_encode(array $payload, $ttlSeconds = 86400) {
    $header  = ['typ' => 'JWT', 'alg' => 'HS256'];
    $payload['iat'] = time();
    $payload['exp'] = time() + $ttlSeconds;
    $h = jwt_b64url_encode(json_encode($header));
    $p = jwt_b64url_encode(json_encode($payload));
    $sig = hash_hmac('sha256', "$h.$p", JWT_SECRET, true);
    return $h . '.' . $p . '.' . jwt_b64url_encode($sig);
}

function jwt_decode($token) {
    if (!is_string($token)) return null;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    list($h, $p, $s) = $parts;
    $expected = jwt_b64url_encode(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
    if (!hash_equals($expected, $s)) return null;          // bad signature
    $payload = json_decode(jwt_b64url_decode($p), true);
    if (!is_array($payload)) return null;
    if (isset($payload['exp']) && time() >= (int) $payload['exp']) return null; // expired
    return $payload;
}
