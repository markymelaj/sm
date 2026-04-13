import { cleanRut } from '@/lib/rut';

export type ConsolidatedCsvRow = {
  parcela: string;
  estadoConsolidado: string;
  confirmadoPor: string;
  propietario: string;
  rut: string;
  rol: string;
  direccion: string;
  telefonos: string;
  estadoSistema: string;
  saldoSistema: number | null;
  observaciones: string;
};

const INDEX: Record<keyof ConsolidatedCsvRow, string> = {
  parcela: 'Parcela',
  estadoConsolidado: 'Estado consolidado',
  confirmadoPor: 'Confirmado por',
  propietario: 'Propietario(s)',
  rut: 'RUT(s)',
  rol: 'ROL',
  direccion: 'Dirección(es)',
  telefonos: 'Teléfono(s)',
  estadoSistema: 'Estado sistema',
  saldoSistema: 'Saldo sistema',
  observaciones: 'Observaciones'
};

function splitCsvLine(line: string) {
  return line.split(';').map((part) => part.trim());
}

function parseCurrency(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function normalizeRoleNumber(value: string) {
  return value.split(',')[0]?.trim() || '';
}

export function parseConsolidatedCsv(content: string) {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r/g, '');
  const lines = normalized.split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [] as ConsolidatedCsvRow[];

  const header = splitCsvLine(lines[0]);
  const headerIndex = new Map(header.map((label, index) => [label, index]));

  function read(label: string, cells: string[]) {
    const index = headerIndex.get(label);
    return index === undefined ? '' : String(cells[index] ?? '').trim();
  }

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return {
      parcela: read(INDEX.parcela, cells),
      estadoConsolidado: read(INDEX.estadoConsolidado, cells),
      confirmadoPor: read(INDEX.confirmadoPor, cells),
      propietario: read(INDEX.propietario, cells),
      rut: cleanRut(read(INDEX.rut, cells)),
      rol: normalizeRoleNumber(read(INDEX.rol, cells)),
      direccion: read(INDEX.direccion, cells),
      telefonos: read(INDEX.telefonos, cells),
      estadoSistema: read(INDEX.estadoSistema, cells),
      saldoSistema: parseCurrency(read(INDEX.saldoSistema, cells)),
      observaciones: read(INDEX.observaciones, cells)
    } satisfies ConsolidatedCsvRow;
  });
}

export function normalizeSystemStatus(value: string) {
  const normalized = value.toLowerCase().trim();
  if (!normalized) return 'sin_definir';
  if (['si', 'sí', 'activo', 'con acceso'].includes(normalized)) return 'con_acceso';
  if (['no', 'inactivo', 'sin acceso'].includes(normalized)) return 'sin_alta';
  return 'sin_definir';
}
