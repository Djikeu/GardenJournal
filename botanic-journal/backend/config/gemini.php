<?php
/**
 * Google Gemini API configuration.
 *
 * SETUP:
 * 1. Get an API key from https://aistudio.google.com/app/apikey
 * 2. Add it to your local .env file as GEMINI_API_KEY=your_key
 * 3. This file reads from the environment so the key isn't committed.
 *
 * The key is read once and exposed via the GEMINI_API_KEY constant.
 */

if (!defined('GEMINI_API_KEY')) {
    // Prefer environment variable; fall back to empty string if not set.
    $envKey = getenv('GEMINI_API_KEY');
    define('GEMINI_API_KEY', $envKey ?: ''); 
}

if (!defined('GEMINI_MODEL')) {
    // Fast, multimodal Gemini model. Change if you prefer another (e.g. gemini-2.0-pro).
    define('GEMINI_MODEL', 'gemini-2.0-flash');
}

if (!defined('GEMINI_API_URL_BASE')) {
    // Model + ":generateContent?key=..." get appended by the calling code.
    define('GEMINI_API_URL_BASE', 'https://generativelanguage.googleapis.com/v1beta/models');
}