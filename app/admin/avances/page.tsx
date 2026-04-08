import { CreateAvanceForm } from '@/components/admin/create-avance-form';
import { requireRole } from '@/lib/auth';
import { formatDate } from '@/lib/format';

export default async function AdminAvancesPage() {
  const { supabase } = await requireRole(['admin']);
  const { data } = await supabase.from('avances_obra').select('*').order('fecha', { ascending: false });
  const avances: any[] = data ?? [];

  return (
    <div className="grid gap-6">
      <CreateAvanceForm />
      <section className="card p-5">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Historial de publicaciones</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {avances.map((avance) => (
            <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={avance.id}>
              <h3 className="text-lg font-bold text-white">{avance.titulo}</h3>
              <p className="muted mt-1 text-xs">{formatDate(avance.fecha)}</p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-200">{avance.descripcion}</p>
            </article>
          ))}
          {avances.length === 0 ? <p className="muted text-sm">Aún no hay avances publicados.</p> : null}
        </div>
      </section>
    </div>
  );
}
