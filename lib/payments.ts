import type { Database } from '@/lib/types';

export const PROJECT_TOTAL = 1_850_000;

export const TRANSFER_DETAILS = [
  'Luminart Instalaciones Y Montajes Ltda',
  '77.045.838-2',
  'Banco Santander',
  'Cuenta Corriente',
  '0-000-8643519-5',
  'tenoriohenriquez@gmail.com'
] as const;

export const CARD_PAYMENT_MESSAGE =
  'Aceptamos pagos con tarjeta de débito o crédito. Consultar por WhatsApp +56 9 8267 5903';

export type QuotaRow = Database['public']['Tables']['cuotas']['Row'];

export function getPaidTotal(cuotas: QuotaRow[]) {
  return cuotas
    .filter((item) => item.estado === 'pagado')
    .reduce((acc, item) => acc + Number(item.monto_total || 0), 0);
}

export function getPendingBalance(cuotas: QuotaRow[]) {
  return Math.max(PROJECT_TOTAL - getPaidTotal(cuotas), 0);
}

export function getNextQuota(cuotas: QuotaRow[]) {
  return cuotas.find((item) => item.estado !== 'pagado') ?? null;
}
