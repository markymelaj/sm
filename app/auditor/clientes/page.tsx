import Link from 'next/link';

import { StatusBadge } from '@/components/status-badge';
import { matchesClientSearch, normalizeClientSearch } from '@/lib/client-search';
import { formatIdentifier } from '@/lib/format';
import { requireRole } from '@/lib/auth';

export default async function AuditorClientesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase } = await requireRole(['auditor']);
  const { q = '' } = await searchParams;

  const [{ data: profilesData }, { data: fichasData }] = await Promise.all([
    supabase.from('perfiles').select('*').eq('rol', 'cliente').order('created_at', { ascending: false }),
    supabase.from('fichas_cliente').select('perfil_id, numero_rol_parcela, parcela')
  ]);

  const fichaMap = new Map<string, any>((fichasData ?? []).map((item: any) => [item.perfil_id, item]));
  const query = normalizeClientSearch(q);
  const profiles: any[] = (profilesData ?? []).filter((profile: any) => {
    const ficha = fichaMap.get(profile.id);
    return matchesClientSearch(query, [
      profile.nombre_completo,
      profile.rut,
      profile.identificador,
      profile.parcela,
      ficha?.parcela,
      ficha?.numero_rol_parcela
    ]);
  });

  return (
    <section className="card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Clientes</p>
          <p className="muted mt-2 text-sm">Busca por nombre, RUT, parcela o número de rol.</p>
        </div>
        <form className="w-full lg:max-w-md" method="get">
          <input className="input" defaultValue={q} name="q" placeholder="Buscar por nombre, RUT, parcela o número de rol" />
        </form>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {profiles.map((profile) => {
          const ficha = fichaMap.get(profile.id);
          return (
            <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={profile.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white">{profile.nombre_completo}</h3>
                  <p className="muted text-sm">{formatIdentifier(profile.rut ?? profile.identificador)}</p>
                </div>
                <StatusBadge label={profile.activo ? 'activo' : 'inactivo'} />
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p className="muted">Parcela: <span className="text-slate-200">{ficha?.parcela || profile.parcela || '—'}</span></p>
                <p className="muted">Número de rol: <span className="text-slate-200">{ficha?.numero_rol_parcela || '—'}</span></p>
              </div>
              <div className="mt-4"><Link className="btn btn-secondary w-full sm:w-fit" href={`/auditor/clientes/${profile.id}`}>Ver ficha</Link></div>
            </article>
          );
        })}
        {profiles.length === 0 ? <p className="muted text-sm">No se encontraron clientes para esa búsqueda.</p> : null}
      </div>
    </section>
  );
}
