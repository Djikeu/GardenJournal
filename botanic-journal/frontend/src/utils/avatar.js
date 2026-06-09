
const FALLBACK_NAME = 'Gardener';

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

export function getAvatarUrl(userOrPath, opts = {}) {
  const size = opts.size || 200;

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

  const safeName = (name || FALLBACK_NAME).trim();
  const bg = colorFor(safeName);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}` +
         `&background=${bg}&color=ffffff&bold=true&size=${size}&rounded=true&format=svg`;
}

export function getDisplayName(user) {
  if (!user) return FALLBACK_NAME;
  return user.name || user.username || user.full_name ||
         (user.email ? user.email.split('@')[0] : FALLBACK_NAME);
}
