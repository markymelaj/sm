import Link from 'next/link';

import { formatCurrency } from '@/lib/format';
import { requireRole } from '@/lib/auth';

export default async function AdminDashboardPage() {
  const { supabase } = await requireRole(['admin']);

  const [{ data: cuotasData }, { count: clientesActivos = 0 }, { count: solicitudesActivas = 0 }] = await Promise.all([
    supabase.from('cuotas').select('monto_total, estado', { count: 'exact' }),
    supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'cliente').eq('activo', true),
    supabase.from('solicitudes').select('*', { count: 'exact', head: true }).in('estado', ['abierta', 'en_revision'])
  ]);

  const cuotas: any[] = cuotasData ?? [];
  const paid = cuotas.filter((item) => item.estado === 'pagado').reduce((sum, item) => sum + Number(item.monto_total), 0);
  const pending = cuotas.filter((item) => item.estado !== 'pagado').reduce((sum, item) => sum + Number(item.monto_total), 0);
  const review = cuotas.filter((item) => item.estado === 'en_revision').length;

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Recaudado</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(paid)}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Por cobrar</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(pending)}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">En revisión</p><h2 className="mt-2 text-2xl font-bold text-white">{review}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Solicitudes activas</p><h2 className="mt-2 text-2xl font-bold text-white">{solicitudesActivas}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Clientes activos</p><h2 className="mt-2 text-2xl font-bold text-white">{clientesActivos}</h2></div>
      </section>
      <section className="card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
        <Link className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" href="/admin/clientes"><p className="text-lg font-bold text-white">Gestión de clientes</p><p className="muted mt-2 text-sm">Alta de usuarios, fichas, estados, seguimiento y cuotas.</p></Link>
        <Link className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" href="/admin/pagos"><p className="text-lg font-bold text-white">Validación de pagos</p><p className="muted mt-2 text-sm">Aprobar, rechazar y registrar auditoría.</p></Link>
        <Link className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" href="/admin/solicitudes"><p className="text-lg font-bold text-white">Solicitudes y consultas</p><p className="muted mt-2 text-sm">Responder, aprobar, rechazar o cerrar casos.</p></Link>
      </section>
    </div>
  );
}
