import Link from 'next/link';

import { formatCurrency } from '@/lib/format';
import { requireRole } from '@/lib/auth';
import { getPaidTotal, getPendingReviewCount, getPendingScheduledTotal, getRejectedCount } from '@/lib/payments';

export default async function AdminDashboardPage() {
  const { supabase } = await requireRole(['admin']);

  const [{ data: cuotasData }, { count: clientesConAcceso = 0 }, { count: clientesSinAlta = 0 }, { count: solicitudesActivas = 0 }] = await Promise.all([
    supabase.from('cuotas').select('monto_total, estado'),
    supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'cliente').eq('activo', true),
    supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'cliente').eq('activo', false),
    supabase.from('solicitudes').select('*', { count: 'exact', head: true }).in('estado', ['abierta', 'en_revision', 'respondida'])
  ]);

  const cuotas: any[] = cuotasData ?? [];
  const paid = getPaidTotal(cuotas as any);
  const pending = getPendingScheduledTotal(cuotas as any);
  const review = getPendingReviewCount(cuotas as any);
  const rejected = getRejectedCount(cuotas as any);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Recaudado</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(paid)}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Por cobrar real</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(pending)}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">En revisión</p><h2 className="mt-2 text-2xl font-bold text-white">{review}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Rechazados</p><h2 className="mt-2 text-2xl font-bold text-white">{rejected}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Con acceso</p><h2 className="mt-2 text-2xl font-bold text-white">{clientesConAcceso}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Sin alta sistema</p><h2 className="mt-2 text-2xl font-bold text-white">{clientesSinAlta}</h2></div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Solicitudes activas</p><h2 className="mt-2 text-2xl font-bold text-white">{solicitudesActivas}</h2></div>
      </section>
      <section className="card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
        <Link className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" href="/admin/clientes"><p className="text-lg font-bold text-white">Gestión de clientes</p><p className="muted mt-2 text-sm">Listado, ficha, seguimiento y activación de acceso.</p></Link>
        <Link className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" href="/admin/usuarios"><p className="text-lg font-bold text-white">Usuarios internos</p><p className="muted mt-2 text-sm">Administra administradores y auditores por separado.</p></Link>
        <Link className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" href="/admin/pagos"><p className="text-lg font-bold text-white">Pagos</p><p className="muted mt-2 text-sm">Revisión, aprobados recientes y filtro por origen.</p></Link>
        <Link className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" href="/admin/importar-base"><p className="text-lg font-bold text-white">Importar base consolidada</p><p className="muted mt-2 text-sm">Vista previa y aplicación segura del CSV.</p></Link>
        <Link className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" href="/admin/cuotas-masivas"><p className="text-lg font-bold text-white">Cuotas masivas</p><p className="muted mt-2 text-sm">Genera varias cuotas para uno o más clientes.</p></Link>
      </section>
    </div>
  );
}
