import Link from 'next/link';

import { CreateUserForm } from '@/components/admin/create-user-form';
import { StatusBadge } from '@/components/status-badge';
import { requireRole } from '@/lib/auth';
import { formatIdentifier } from '@/lib/format';

export default async function AdminClientesPage() {
  const { supabase } = await requireRole(['admin']);
  const { data } = await supabase
    .from('perfiles')
    .select('*')
    .order('created_at', { ascending: false });

  const profiles: any[] = data ?? [];

  return (
    <div className="grid gap-6">
      <CreateUserForm />
      <section className="card p-5">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Usuarios</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {profiles.map((profile) => (
            <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={profile.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-bold text-white">{profile.nombre_completo}</h3>
                  <p className="muted break-words text-sm">{formatIdentifier(profile.rut ?? profile.identificador)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={profile.activo ? 'activo' : 'inactivo'} />
                  <span className="badge border border-white/10 bg-white/5 text-slate-200">{profile.rol}</span>
                </div>
              </div>
              <p className="muted mt-3 text-sm">Parcela: {profile.parcela || '—'}</p>
              <div className="mt-4">
                <Link className="btn btn-secondary w-full sm:w-fit" href={`/admin/clientes/${profile.id}`}>
                  Abrir ficha
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
