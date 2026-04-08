export function generateTemporaryPassword(prefix = 'SM'): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const base = cleanPrefix.slice(0, 2) || 'SM';
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${base}${number}!`;
}
