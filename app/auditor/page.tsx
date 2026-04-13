import { requireRole } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import { getPaidTotal, getPendingReviewCount, getPendingScheduledTotal, getRejectedCount } from '@/lib/payments';

export default async function AuditorPage() {
  const { supabase } = await requireRole(['auditor']);
  const [{ data: cuotasData }, { count: solicitudes = 0 }, { count: clientesActivos = 0 }] = await Promise.all([
    supabase.from('cuotas').select('monto_total, estado'),
    supabase.from('solicitudes').select('*', { count: 'exact', head: true }).in('estado', ['abierta', 'en_revision', 'respondida']),
    supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'cliente').eq('activo', true)
  ]);

  const cuotas: any[] = cuotasData ?? [];
  const paid = getPaidTotal(cuotas as any);
  const pending = getPendingScheduledTotal(cuotas as any);
  const review = getPendingReviewCount(cuotas as any);
  const rejected = getRejectedCount(cuotas as any);

  return (
    <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Recaudado</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(paid)}</h2></div>
      <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Por cobrar real</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(pending)}</h2></div>
      <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">En revisión</p><h2 className="mt-2 text-2xl font-bold text-white">{review}</h2></div>
      <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Rechazados</p><h2 className="mt-2 text-2xl font-bold text-white">{rejected}</h2></div>
      <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Solicitudes activas</p><h2 className="mt-2 text-2xl font-bold text-white">{solicitudes}</h2></div>
      <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Clientes activos</p><h2 className="mt-2 text-2xl font-bold text-white">{clientesActivos}</h2></div>
    </section>
  );
}
