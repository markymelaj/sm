import { cleanRut, normalizeIdentifier } from '@/lib/rut';

function normalizeText(value: string | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizeClientSearch(value: string | null | undefined) {
  const raw = String(value ?? '').trim();
  return {
    raw,
    text: normalizeText(raw),
    identifier: normalizeIdentifier(raw),
    rut: cleanRut(raw)
  };
}

export function matchesClientSearch(
  query: ReturnType<typeof normalizeClientSearch>,
  values: Array<string | null | undefined>
) {
  if (!query.raw) return true;

  return values.some((value) => {
    const original = String(value ?? '').trim();
    if (!original) return false;

    const text = normalizeText(original);
    const identifier = normalizeIdentifier(original);
    const rut = cleanRut(original);

    return (
      text.includes(query.text) ||
      identifier.includes(query.identifier) ||
      rut.includes(query.rut)
    );
  });
}
