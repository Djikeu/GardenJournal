/**
 * Avatar URL resolver.
 * - If the user uploaded an avatar, return that (with localhost prefix when relative).
 * - Otherwise, generate a deterministic avatar using ui-avatars.com — a colored
 *   circle with the user's initials, themed in our brand green.
 *
 * Usage:
 *   import { getAvatarUrl } from '../utils/avatar';
 *   <img src={getAvatarUrl(user)} alt={user.name} />
 */

const FALLBACK_NAME = 'Gardener';

// Pick a stable bg color from a small palette based on the user's name,
// so the same person always gets the same color across the app
const PALETTE = [
  '2e7d32', // forest green (brand)
  '388e3c',
  '0369a1', // blue
  'b45309', // amber
  '7c3aed', // violet
  'be185d', // pink
  '0d9488', // teal
];

function hashName(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function colorFor(name) {
  if (!name) return PALETTE[0];
  return PALETTE[hashName(name) % PALETTE.length];
}

/**
 * Resolve an avatar URL from a user object or a raw avatar path.
 *
 * @param {object|string|null} userOrPath  Either a user object {name, avatar} or a raw path string
 * @param {object}             [opts]
 * @param {number}             [opts.size=200]   Avatar size in pixels
 * @param {string}             [opts.name]       Force-override the name used for the fallback
 */
export function getAvatarUrl(userOrPath, opts = {}) {
  const size = opts.size || 200;

  // Accept either a user object or a raw avatar path
  let path = null;
  let name = opts.name;
  if (typeof userOrPath === 'string') {
    path = userOrPath;
  } else if (userOrPath && typeof userOrPath === 'object') {
    path = userOrPath.avatar;
    name = name || userOrPath.name || userOrPath.username || userOrPath.email?.split('@')[0];
  }

  if (path && typeof path === 'string' && path.trim() !== '') {
    if (path.startsWith('http')) return path;
    return `http://localhost${path}`;
  }

  // Generate a colored-initials avatar
  const safeName = (name || FALLBACK_NAME).trim();
  const bg = colorFor(safeName);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}` +
         `&background=${bg}&color=ffffff&bold=true&size=${size}&rounded=true&format=svg`;
}

/**
 * Resolve a display name with a sensible fallback chain.
 */
export function getDisplayName(user) {
  if (!user) return FALLBACK_NAME;
  return user.name || user.username || user.full_name ||
         (user.email ? user.email.split('@')[0] : FALLBACK_NAME);
}
