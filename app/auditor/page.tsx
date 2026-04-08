import { requireRole } from '@/lib/auth';

export default async function AuditorPage() {
  const { supabase } = await requireRole(['auditor']);
  const [{ count: pagos = 0 }, { count: solicitudes = 0 }] = await Promise.all([
    supabase.from('cuotas').select('*', { count: 'exact', head: true }).eq('estado', 'en_revision'),
    supabase.from('solicitudes').select('*', { count: 'exact', head: true }).in('estado', ['abierta', 'en_revision', 'respondida'])
  ]);

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Pagos en revisión</p><h2 className="mt-2 text-2xl font-bold text-white">{pagos}</h2></div>
      <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Solicitudes pendientes</p><h2 className="mt-2 text-2xl font-bold text-white">{solicitudes}</h2></div>
    </section>
  );
}
