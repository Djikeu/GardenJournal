<?php
/**
 * Google Gemini API configuration.
 *
 * SETUP (free, ~30 seconds, no credit card):
 *   1. Visit https://aistudio.google.com/apikey
 *   2. Click "Create API key" (sign in with any Google account)
 *   3. Copy the key and paste it below in place of the placeholder
 *   4. (Recommended) add this file to .gitignore so the key isn't committed
 *
 * Free tier limits (as of 2026): 15 requests/minute, 1,500 requests/day.
 * Plenty for personal use of Plant Doctor.
 */

if (!defined('GEMINI_API_KEY')) {
    $envKey = getenv('GEMINI_API_KEY');
    define('GEMINI_API_KEY', $envKey ?: 'AIzaSyDl2qRV-nWA_eU-IKL2WPtVDSpk8_ysqy4');
}

if (!defined('GEMINI_MODEL')) {
    // gemini-2.0-flash is the free, fast, vision-capable model.
    // Alternatives: 'gemini-1.5-flash' (older but stable), 'gemini-1.5-pro' (higher quality).
    define('GEMINI_MODEL', 'gemini-2.5-flash');
}

if (!defined('GEMINI_API_URL_BASE')) {
    define('GEMINI_API_URL_BASE', 'https://generativelanguage.googleapis.com/v1beta/models');
}
   