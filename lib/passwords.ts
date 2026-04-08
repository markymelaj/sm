export function generateTemporaryPassword(prefix = 'Acceso'): string {
  const chunk = Math.random().toString(36).slice(-6).toUpperCase();
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}#${chunk}${number}!`;
}
