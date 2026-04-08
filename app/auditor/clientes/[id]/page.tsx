import Link from 'next/link';

import { requireRole } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { formatRut } from '@/lib/rut';

export default async function AuditorClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireRole(['auditor']);
  const { id } = await Promise.resolve(params);
  const [{ data: profileData }, { data: fichaData }, { data: seguimientoData }, { data: estadoTiposData }] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', id).single(),
    supabase.from('fichas_cliente').select('*').eq('perfil_id', id).maybeSingle(),
    supabase.from('seguimiento_parcela').select('*').eq('perfil_id', id).maybeSingle(),
    supabase.from('ficha_estado_tipos').select('*').eq('is_active', true).order('sort_order', { ascending: true })
  ]);
  const profile: any = profileData;
  const ficha: any = fichaData;
  const seguimiento: any = seguimientoData;
  const estadoTipos: any[] = estadoTiposData ?? [];
  const values: any[] = ficha ? ((await supabase.from('ficha_estado_valores').select('*').eq('ficha_id', ficha.id)).data ?? []) : [];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-3"><Link className="btn btn-secondary" href="/auditor/clientes">Volver</Link></div>
      <section className="card p-5">
        <h2 className="text-2xl font-bold text-white">{profile.nombre_completo}</h2>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><p className="muted">Titular</p><p>{ficha?.titular_parcela || '—'}</p></div>
          <div><p className="muted">RUT titular</p><p>{ficha?.rut_titular ? formatRut(ficha.rut_titular) : '—'}</p></div>
          <div><p className="muted">Rol parcela</p><p>{ficha?.numero_rol_parcela || '—'}</p></div>
          <div><p className="muted">Número parcela</p><p>{ficha?.numero_parcela || '—'}</p></div>
          <div><p className="muted">Observaciones</p><p className="whitespace-pre-wrap break-words">{ficha?.observaciones || '—'}</p></div>
          <div><p className="muted">Seguimiento</p><p className="whitespace-pre-wrap break-words">{seguimiento?.avance_particular || '—'}</p></div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {estadoTipos.map((tipo) => {
            const value = values.find((item) => item.estado_tipo_id === tipo.id);
            const display = tipo.tipo_input === 'boolean' ? (value?.valor_bool ? 'Sí' : 'No') : tipo.tipo_input === 'date' ? formatDate(value?.valor_fecha) : value?.valor_texto || '—';
            return <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={tipo.id}><p className="text-sm font-bold text-white">{tipo.etiqueta}</p><p className="mt-2 text-sm text-slate-200">{display}</p></div>;
          })}
        </div>
      </section>
    </div>
  );
}
