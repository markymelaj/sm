export function normalizeIdentifier(value: string): string {
  return value.replace(/[^0-9a-zA-Z]/g, '').trim().toUpperCase();
}

export function cleanRut(value: string): string {
  return normalizeIdentifier(value);
}

export function formatRut(rut: string | null | undefined): string {
  const clean = cleanRut(rut ?? '');
  if (!clean || !/\d/.test(clean) || clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
}

export function makeTechnicalEmail(identifier: string): string {
  return `${normalizeIdentifier(identifier).toLowerCase()}@clientes.portal.local`;
}

export function slugifyFilename(name: string): string {
  const extIndex = name.lastIndexOf('.');
  const ext = extIndex >= 0 ? name.slice(extIndex).toLowerCase() : '';
  const base = extIndex >= 0 ? name.slice(0, extIndex) : name;
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${slug || 'archivo'}${ext}`;
}
