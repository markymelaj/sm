import Link from 'next/link';

import { StatusBadge } from '@/components/status-badge';
import { formatIdentifier } from '@/lib/format';
import { requireRole } from '@/lib/auth';

export default async function AdminUsuariosPage() {
  const { supabase } = await requireRole(['admin']);
  const { data } = await supabase
    .from('perfiles')
    .select('*')
    .in('rol', ['admin', 'auditor'])
    .order('created_at', { ascending: false });

  const users: any[] = data ?? [];

  return (
    <section className="card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Usuarios internos</p>
          <p className="muted mt-2 text-sm">Aquí aparecen solo los usuarios internos del sistema.</p>
        </div>
        <Link className="btn btn-primary w-full lg:w-fit" href="/admin/usuarios/alta">
          Alta de usuario
        </Link>
      </div>

      <div className="mt-5 overflow-x-auto hidden md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
              <th className="px-3 py-3">Nombre</th>
              <th className="px-3 py-3">Acceso</th>
              <th className="px-3 py-3">Rol</th>
              <th className="px-3 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-b border-white/6 last:border-b-0" key={user.id}>
                <td className="px-3 py-4 text-white">{user.nombre_completo}</td>
                <td className="px-3 py-4 text-slate-200">{formatIdentifier(user.identificador)}</td>
                <td className="px-3 py-4 text-slate-200">{user.rol}</td>
                <td className="px-3 py-4"><StatusBadge label={user.activo ? 'activo' : 'inactivo'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 divide-y divide-white/8 md:hidden">
        {users.map((user) => (
          <article className="py-3" key={user.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-white">{user.nombre_completo}</h3>
                <p className="muted mt-1 text-sm">{formatIdentifier(user.identificador)} · {user.rol}</p>
              </div>
              <StatusBadge label={user.activo ? 'activo' : 'inactivo'} />
            </div>
          </article>
        ))}
      </div>

      {users.length === 0 ? <p className="muted mt-4 text-sm">No hay usuarios internos cargados.</p> : null}
    </section>
  );
}
