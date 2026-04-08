import Link from 'next/link';

import { StatusBadge } from '@/components/status-badge';
import { requireRole } from '@/lib/auth';
import { formatIdentifier } from '@/lib/format';

export default async function AuditorClientesPage() {
  const { supabase } = await requireRole(['auditor']);
  const { data } = await supabase.from('perfiles').select('*').eq('rol', 'cliente').order('created_at', { ascending: false });
  const profiles: any[] = data ?? [];

  return (
    <section className="card p-5">
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Clientes</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {profiles.map((profile) => (
          <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={profile.id}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-white">{profile.nombre_completo}</h3><p className="muted text-sm">{formatIdentifier(profile.rut ?? profile.identificador)}</p></div><StatusBadge label={profile.activo ? 'activo' : 'inactivo'} /></div>
            <p className="muted mt-3 text-sm">Parcela: {profile.parcela || '—'}</p>
            <div className="mt-4"><Link className="btn btn-secondary w-full sm:w-fit" href={`/auditor/clientes/${profile.id}`}>Ver ficha</Link></div>
          </article>
        ))}
      </div>
    </section>
  );
}
