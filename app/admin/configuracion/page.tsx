import { StatusTypeForm } from '@/components/admin/status-type-form';
import { requireRole } from '@/lib/auth';

export default async function AdminConfiguracionPage() {
  const { supabase } = await requireRole(['admin']);
  const { data } = await supabase.from('ficha_estado_tipos').select('*').order('sort_order', { ascending: true });
  const tipos: any[] = data ?? [];

  return (
    <div className="grid gap-6">
      <StatusTypeForm />
      <section className="card p-5">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Estados disponibles</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {tipos.map((tipo) => (
            <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={tipo.id}>
              <h3 className="text-lg font-bold text-white">{tipo.etiqueta}</h3>
              <p className="muted mt-1 text-sm">Código: {tipo.codigo} · Tipo: {tipo.tipo_input}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
