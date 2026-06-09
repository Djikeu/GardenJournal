export const cleanText = (s) =>
  typeof s === 'string'
    ? s.replace(/\s*\?{3,}\s*/g, ' ').replace(/[ \t]{2,}/g, ' ').trim()
    : (s ?? '');

export default cleanText;
