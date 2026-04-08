import Link from 'next/link';

import { StatusBadge } from '@/components/status-badge';
import {
  buildContractStatusMap,
  CONTRACT_STATUS_OPTIONS,
  FILTER_WITH_CONTRACT,
  matchesContractFilter
} from '@/lib/contracts';
import { matchesClientSearch, normalizeClientSearch } from '@/lib/client-search';
import { formatIdentifier } from '@/lib/format';
import { requireRole } from '@/lib/auth';

export default async function AuditorClientesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; contrato?: string }>;
}) {
  const { supabase } = await requireRole(['auditor']);
  const { q = '', contrato = '' } = await searchParams;

  const [{ data: profilesData }, { data: fichasData }, { data: estadoTiposData }] = await Promise.all([
    supabase.from('perfiles').select('*').eq('rol', 'cliente').order('created_at', { ascending: false }),
    supabase.from('fichas_cliente').select('id, perfil_id, numero_rol_parcela, parcela'),
    supabase.from('ficha_estado_tipos').select('id, codigo').eq('is_active', true)
  ]);

  const fichas: any[] = fichasData ?? [];
  const fichaIds = fichas.map((item) => item.id);
  const { data: estadoValoresData } = fichaIds.length
    ? await supabase.from('ficha_estado_valores').select('ficha_id, estado_tipo_id, valor_bool, valor_texto').in('ficha_id', fichaIds)
    : { data: [] };

  const fichaMap = new Map<string, any>(fichas.map((item: any) => [item.perfil_id, item]));
  const contractStatusByProfile = buildContractStatusMap(fichas, estadoTiposData ?? [], estadoValoresData ?? []);
  const query = normalizeClientSearch(q);
  const profiles: any[] = (profilesData ?? []).filter((profile: any) => {
    const ficha = fichaMap.get(profile.id);
    const contractStatus = contractStatusByProfile.get(profile.id);
    return matchesClientSearch(query, [
      profile.nombre_completo,
      profile.rut,
      profile.identificador,
      profile.parcela,
      ficha?.parcela,
      ficha?.numero_rol_parcela
    ]) && matchesContractFilter(contrato || undefined, contractStatus);
  });

  return (
    <section className="card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Clientes</p>
          <p className="muted mt-2 text-sm">Busca por nombre, RUT, parcela, número de rol o estado contractual.</p>
        </div>
        <Link className="btn btn-secondary w-full sm:w-fit" href="/auditor">Volver al resumen</Link>
      </div>
      <form className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px_auto]" method="get">
        <input className="input" defaultValue={q} name="q" placeholder="Buscar por nombre, RUT, parcela o número de rol" />
        <select className="select" defaultValue={contrato} name="contrato">
          <option value="">Todos los estados contractuales</option>
          <option value={FILTER_WITH_CONTRACT}>Con contrato</option>
          {CONTRACT_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <button className="btn btn-secondary" type="submit">Filtrar</button>
      </form>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {profiles.map((profile) => {
          const ficha = fichaMap.get(profile.id);
          const contractStatus = contractStatusByProfile.get(profile.id);
          return (
            <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={profile.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white">{profile.nombre_completo}</h3>
                  <p className="muted text-sm">{formatIdentifier(profile.rut ?? profile.identificador)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={profile.activo ? 'activo' : 'inactivo'} />
                  {contractStatus ? <span className="badge border border-white/10 bg-white/5 text-slate-200">{contractStatus}</span> : null}
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p className="muted">Parcela: <span className="text-slate-200">{ficha?.parcela || profile.parcela || '—'}</span></p>
                <p className="muted">Número de rol: <span className="text-slate-200">{ficha?.numero_rol_parcela || '—'}</span></p>
              </div>
              <div className="mt-4"><Link className="btn btn-secondary w-full sm:w-fit" href={`/auditor/clientes/${profile.id}`}>Ver ficha</Link></div>
            </article>
          );
        })}
        {profiles.length === 0 ? <p className="muted text-sm">No se encontraron clientes para esa búsqueda o filtro.</p> : null}
      </div>
    </section>
  );
}
