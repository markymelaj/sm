import Link from 'next/link';

import { StatusBadge } from '@/components/status-badge';
import { matchesClientSearch, normalizeClientSearch } from '@/lib/client-search';
import { formatCurrency, formatIdentifier } from '@/lib/format';
import { requireRole } from '@/lib/auth';
import { getPendingBalance } from '@/lib/payments';

export default async function AdminClientesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase } = await requireRole(['admin']);
  const { q = '' } = await searchParams;

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
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Clientes</p>
          <p className="muted mt-2 text-sm">Un cliente por fila. Busca por nombre, RUT, parcela o número de rol.</p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
          <form className="w-full lg:min-w-[360px]" method="get">
            <input className="input" defaultValue={q} name="q" placeholder="Buscar por nombre, RUT, parcela o número de rol" />
          </form>
          <Link className="btn btn-secondary w-full lg:w-fit" href="/admin/usuarios">
            Usuarios internos
          </Link>
          <Link className="btn btn-primary w-full lg:w-fit" href="/admin/usuarios/alta">
            Alta de usuario
          </Link>
        </div>
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
                  <td className="px-3 py-4 text-right">
                    <Link className="btn btn-secondary w-full lg:w-fit" href={`/admin/clientes/${profile.id}`}>
                      Ver / editar
                    </Link>
                  </td>
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
                <Link className="btn btn-secondary w-full" href={`/admin/clientes/${profile.id}`}>
                  Ver / editar
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {profiles.length === 0 ? <p className="muted mt-4 text-sm">No se encontraron clientes para esa búsqueda.</p> : null}
    </section>
  );
}
