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
export type QuotaAuditRow = Database['public']['Tables']['cuota_auditorias']['Row'];

export function getPaidTotal(cuotas: QuotaRow[]) {
  return cuotas
    .filter((item) => item.estado === 'pagado')
    .reduce((acc, item) => acc + Number(item.monto_total || 0), 0);
}

export function getPendingScheduledTotal(cuotas: QuotaRow[]) {
  return cuotas
    .filter((item) => item.estado === 'pendiente')
    .reduce((acc, item) => acc + Number(item.monto_total || 0), 0);
}

export function getPendingBalance(cuotas: QuotaRow[]) {
  return Math.max(PROJECT_TOTAL - getPaidTotal(cuotas), 0);
}

export function getNextQuota(cuotas: QuotaRow[]) {
  return cuotas.find((item) => item.estado !== 'pagado') ?? null;
}

export function getPendingReviewCount(cuotas: QuotaRow[]) {
  return cuotas.filter((item) => item.estado === 'en_revision').length;
}

export function getRejectedCount(cuotas: QuotaRow[]) {
  return cuotas.filter((item) => item.estado === 'rechazado').length;
}

export function inferPaymentOrigin(cuotaId: string, auditorias: QuotaAuditRow[]) {
  const related = auditorias.filter((item) => item.cuota_id === cuotaId);
  if (related.some((item) => item.accion === 'registro_cliente')) return 'cliente';
  if (related.some((item) => item.accion === 'crear_cuota')) return 'admin';
  return 'sistema';
}

export function getPaymentOriginLabel(origin: 'cliente' | 'admin' | 'sistema') {
  if (origin === 'cliente') return 'Cliente';
  if (origin === 'admin') return 'Admin';
  return 'Sistema';
}

export function sortQuotasByUpdatedDesc<T extends Pick<QuotaRow, 'updated_at' | 'created_at'>>(items: T[]) {
  return [...items].sort((a, b) => {
    const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
    const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });
}
