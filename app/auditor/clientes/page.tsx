import Link from 'next/link';

import { StatusBadge } from '@/components/status-badge';
import { matchesClientSearch, normalizeClientSearch } from '@/lib/client-search';
import { formatCurrency, formatIdentifier } from '@/lib/format';
import { requireRole } from '@/lib/auth';
import { getPendingBalance } from '@/lib/payments';

const SYSTEM_FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'con-acceso', label: 'Con acceso' },
  { key: 'sin-alta', label: 'Sin alta sistema' }
] as const;

export default async function AuditorClientesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; system?: string }>;
}) {
  const { supabase } = await requireRole(['auditor']);
  const { q = '', system = 'todos' } = await searchParams;

  const [{ data: profilesData }, { data: fichasData }, { data: cuotasData }] = await Promise.all([
    supabase.from('perfiles').select('*').eq('rol', 'cliente').order('created_at', { ascending: false }),
    supabase.from('fichas_cliente').select('perfil_id, numero_rol_parcela, parcela'),
    supabase.from('cuotas').select('perfil_id, monto_total, estado')
  ]);

  const fichaMap = new Map<string, any>((fichasData ?? []).map((item: any) => [item.perfil_id, item]));
  const cuotasMap = new Map<string, any[]>();
  for (const cuota of cuotasData ?? []) {
    const items = cuotasMap.get(cuota.perfil_id) ?? [];
    items.push(cuota);
    cuotasMap.set(cuota.perfil_id, items);
  }

  const query = normalizeClientSearch(q);
  const normalizedSystem = SYSTEM_FILTERS.some((item) => item.key === system) ? system : 'todos';
  const profiles: any[] = (profilesData ?? []).filter((profile: any) => {
    const ficha = fichaMap.get(profile.id);
    const matchesSearch = matchesClientSearch(query, [
      profile.nombre_completo,
      profile.rut,
      profile.identificador,
      profile.parcela,
      ficha?.parcela,
      ficha?.numero_rol_parcela
    ]);

    if (!matchesSearch) return false;
    if (normalizedSystem === 'con-acceso') return profile.activo === true;
    if (normalizedSystem === 'sin-alta') return profile.activo === false;
    return true;
  });

  return (
    <section className="card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Clientes</p>
          <p className="muted mt-2 text-sm">Busca por nombre, RUT, parcela o número de rol.</p>
        </div>
        <form className="w-full lg:max-w-md" method="get">
          <input type="hidden" name="system" value={normalizedSystem} />
          <input className="input" defaultValue={q} name="q" placeholder="Buscar por nombre, RUT, parcela o número de rol" />
        </form>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {SYSTEM_FILTERS.map((item) => (
          <a
            key={item.key}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${normalizedSystem === item.key ? 'border-sky-300/40 bg-sky-400/15 text-sky-200' : 'border-white/10 bg-slate-900/45 text-slate-200'}`}
            href={`/auditor/clientes?system=${item.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
          >
            {item.label}
          </a>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto hidden md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
              <th className="px-3 py-3">Cliente</th>
              <th className="px-3 py-3">RUT</th>
              <th className="px-3 py-3">Parcela</th>
              <th className="px-3 py-3">N° rol</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Saldo</th>
              <th className="px-3 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => {
              const ficha = fichaMap.get(profile.id);
              const saldoPendiente = getPendingBalance(cuotasMap.get(profile.id) ?? []);
              return (
                <tr className="border-b border-white/6 last:border-b-0" key={profile.id}>
                  <td className="px-3 py-4 text-white">{profile.nombre_completo}</td>
                  <td className="px-3 py-4 text-slate-200">{formatIdentifier(profile.rut ?? profile.identificador)}</td>
                  <td className="px-3 py-4 text-slate-200">{ficha?.parcela || profile.parcela || '—'}</td>
                  <td className="px-3 py-4 text-slate-200">{ficha?.numero_rol_parcela || '—'}</td>
                  <td className="px-3 py-4"><StatusBadge label={profile.activo ? 'activo' : 'inactivo'} /></td>
                  <td className="px-3 py-4 text-slate-200">{formatCurrency(saldoPendiente)}</td>
                  <td className="px-3 py-4 text-right"><Link className="btn btn-secondary w-full lg:w-fit" href={`/auditor/clientes/${profile.id}`}>Ver ficha</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 divide-y divide-white/8 md:hidden">
        {profiles.map((profile) => {
          const ficha = fichaMap.get(profile.id);
          const saldoPendiente = getPendingBalance(cuotasMap.get(profile.id) ?? []);
          return (
            <article className="py-3" key={profile.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-white">{profile.nombre_completo}</h3>
                  <p className="muted mt-1 text-sm">{formatIdentifier(profile.rut ?? profile.identificador)}</p>
                  <p className="muted mt-1 text-sm">Parcela: <span className="text-slate-200">{ficha?.parcela || profile.parcela || '—'}</span></p>
                  <p className="muted mt-1 text-sm">N° rol: <span className="text-slate-200">{ficha?.numero_rol_parcela || '—'}</span></p>
                  <p className="muted mt-1 text-sm">Saldo: <span className="text-slate-200">{formatCurrency(saldoPendiente)}</span></p>
                </div>
                <StatusBadge label={profile.activo ? 'activo' : 'inactivo'} />
              </div>
              <div className="mt-3">
                <Link className="btn btn-secondary w-full" href={`/auditor/clientes/${profile.id}`}>Ver ficha</Link>
              </div>
            </article>
          );
        })}
      </div>

      {profiles.length === 0 ? <p className="muted mt-4 text-sm">No se encontraron clientes para ese filtro.</p> : null}
    </section>
  );
}
