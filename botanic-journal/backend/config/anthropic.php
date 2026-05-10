<?php
/**
 * Anthropic / Claude API configuration.
 *
 * SETUP:
 *   1. Get an API key from https://console.anthropic.com/
 *   2. Replace the placeholder below with your real key
 *   3. (Recommended) Add this file to .gitignore so the key isn't committed
 *
 * The key is read once and exposed via ANTHROPIC_API_KEY constant.
 */

if (!defined('ANTHROPIC_API_KEY')) {
    // Prefer environment variable; fall back to inline value for local dev.
    $envKey = getenv('ANTHROPIC_API_KEY');
    define('ANTHROPIC_API_KEY', $envKey ?: 'sk-ant-PASTE-YOUR-KEY-HERE');
}

if (!defined('ANTHROPIC_MODEL')) {
    // Vision-capable Claude model. Sonnet is a good speed/quality balance.
    define('ANTHROPIC_MODEL', 'claude-sonnet-4-5');
}

if (!defined('ANTHROPIC_API_URL')) {
    define('ANTHROPIC_API_URL', 'https://api.anthropic.com/v1/messages');
}
