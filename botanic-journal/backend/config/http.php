<?php
/**
 * Shared HTTP helper used by all AI-calling endpoints.
 *
 * Prefers curl if loaded; falls back to file_get_contents + stream_context
 * when the curl extension isn't available (or the XAMPP php_curl.dll has a
 * libssl version mismatch — see SSL_get0_group_name DLL error).
 *
 * Returns [body|false, http_code, errString]
 */

if (!function_exists('httpPostJson')) {
    function httpPostJson($url, $payload, $timeout = 60, $extraHeaders = []) {
        $json = json_encode($payload);
        // Always send JSON content-type; callers can add auth headers (e.g. Bearer token).
        $headers = array_merge(['Content-Type: application/json'], (array) $extraHeaders);

        // ── Prefer curl when it actually works ────────────────────────────
        if (function_exists('curl_init')) {
            $caBundle = ini_get('curl.cainfo') ?: ini_get('openssl.cafile');
            $hasCaBundle = $caBundle && file_exists($caBundle);

            $ch = curl_init($url);
            $opts = [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $json,
                CURLOPT_HTTPHEADER     => $headers,
                CURLOPT_TIMEOUT        => $timeout,
            ];
            if ($hasCaBundle) {
                $opts[CURLOPT_CAINFO] = $caBundle;
            } else {
                $opts[CURLOPT_SSL_VERIFYPEER] = false;
                $opts[CURLOPT_SSL_VERIFYHOST] = 0;
            }
            curl_setopt_array($ch, $opts);

            $body = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err  = curl_error($ch);
            curl_close($ch);
            return [$body, $code, $err];
        }

        // ── Fallback: native PHP streams (no extension required) ─────────
        if (!ini_get('allow_url_fopen')) {
            return [false, 0, 'Neither curl nor allow_url_fopen is available on this PHP install.'];
        }

        $context = stream_context_create([
            'http' => [
                'method'        => 'POST',
                'header'        => implode("\r\n", $headers) . "\r\n",
                'content'       => $json,
                'timeout'       => $timeout,
                'ignore_errors' => true,
            ],
            'ssl' => [
                'verify_peer'      => false,
                'verify_peer_name' => false,
            ],
        ]);

        $body = @file_get_contents($url, false, $context);

        $code = 0;
        if (isset($http_response_header) && is_array($http_response_header)) {
            foreach ($http_response_header as $line) {
                if (preg_match('#^HTTP/\S+\s+(\d+)#', $line, $m)) {
                    $code = intval($m[1]);
                    break;
                }
            }
        }
        if ($body === false) {
            $lastErr = error_get_last();
            $msg = $lastErr['message'] ?? 'file_get_contents failed (network/DNS/SSL).';
            return [false, 0, $msg];
        }
        return [$body, $code, ''];
    }
}
