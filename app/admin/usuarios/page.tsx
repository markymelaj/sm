import Link from 'next/link';

import { StatusBadge } from '@/components/status-badge';
import { normalizeClientSearch, matchesClientSearch } from '@/lib/client-search';
import { formatIdentifier } from '@/lib/format';
import { requireRole } from '@/lib/auth';

export default async function AdminUsuariosPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase } = await requireRole(['admin']);
  const { q = '' } = await searchParams;

  const { data } = await supabase
    .from('perfiles')
    .select('*')
    .in('rol', ['admin', 'auditor'])
    .order('rol', { ascending: true })
    .order('nombre_completo', { ascending: true });

  const query = normalizeClientSearch(q);
  const profiles: any[] = (data ?? []).filter((profile: any) =>
    matchesClientSearch(query, [profile.nombre_completo, profile.identificador, profile.rut, profile.email])
  );

  return (
    <div className="grid gap-6">
      <section className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Usuarios internos</p>
            <p className="muted mt-2 text-sm">Admin y auditores del sistema. Los clientes se gestionan en la sección Clientes.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form className="w-full sm:min-w-[320px]" method="get">
              <input className="input" defaultValue={q} name="q" placeholder="Buscar por nombre, usuario interno o email" />
            </form>
            <Link className="btn btn-primary whitespace-nowrap" href="/admin/usuarios/alta">
              Alta de usuario
            </Link>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {profiles.map((profile) => (
            <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={profile.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-bold text-white">{profile.nombre_completo}</h3>
                  <p className="muted break-words text-sm">{formatIdentifier(profile.identificador)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={profile.activo ? 'activo' : 'inactivo'} />
                  <span className="badge border border-white/10 bg-white/5 text-slate-200">{profile.rol}</span>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p className="muted">Email: <span className="text-slate-200">{profile.email || '—'}</span></p>
                <p className="muted">Usuario: <span className="text-slate-200">{profile.identificador}</span></p>
              </div>
              <div className="mt-4">
                <Link className="btn btn-secondary w-full sm:w-fit" href={`/admin/clientes/${profile.id}`}>
                  Abrir ficha
                </Link>
              </div>
            </article>
          ))}
          {profiles.length === 0 ? <p className="muted text-sm">No se encontraron usuarios internos para esa búsqueda.</p> : null}
        </div>
      </section>
    </div>
  );
}
