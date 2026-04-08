import Link from 'next/link';

import { StatusBadge } from '@/components/status-badge';
import { requireRole } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/format';
import { getNextQuota, getPaidTotal, getPendingBalance, PROJECT_TOTAL } from '@/lib/payments';
import { buildContractStatusMap } from '@/lib/contracts';
import { formatRut } from '@/lib/rut';

export default async function AuditorClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireRole(['auditor']);
  const { id } = await Promise.resolve(params);
  const [{ data: profileData }, { data: fichaData }, { data: seguimientoData }, { data: estadoTiposData }, { data: cuotasData }] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', id).single(),
    supabase.from('fichas_cliente').select('*').eq('perfil_id', id).maybeSingle(),
    supabase.from('seguimiento_parcela').select('*').eq('perfil_id', id).maybeSingle(),
    supabase.from('ficha_estado_tipos').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    supabase.from('cuotas').select('*').eq('perfil_id', id).order('fecha_vencimiento', { ascending: true })
  ]);
  const profile: any = profileData;
  const ficha: any = fichaData;
  const seguimiento: any = seguimientoData;
  const estadoTipos: any[] = estadoTiposData ?? [];
  const cuotas: any[] = cuotasData ?? [];
  const values: any[] = ficha ? ((await supabase.from('ficha_estado_valores').select('*').eq('ficha_id', ficha.id)).data ?? []) : [];
  const contractStatus = ficha ? buildContractStatusMap([{ id: ficha.id, perfil_id: profile.id }], estadoTipos, values).get(profile.id) ?? null : null;

  const totalPagado = getPaidTotal(cuotas as any);
  const saldoPendiente = getPendingBalance(cuotas as any);
  const nextQuota = getNextQuota(cuotas as any);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-3"><Link className="btn btn-secondary" href="/auditor/clientes">Volver</Link></div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Valor total</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(PROJECT_TOTAL)}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Pagado</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(totalPagado)}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Saldo pendiente</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(saldoPendiente)}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Próximo pago</p><h2 className="mt-2 text-xl font-bold text-white">{nextQuota ? formatCurrency(nextQuota.monto_total) : 'Sin próximos pagos'}</h2><p className="muted mt-2 text-sm">{nextQuota ? `Fecha de pago: ${formatDate(nextQuota.fecha_vencimiento)}` : 'No hay cuotas pendientes.'}</p>{nextQuota ? <div className="mt-3"><StatusBadge label={nextQuota.estado} /></div> : null}</div>
      </section>
      <section className="card p-5">
        <h2 className="text-2xl font-bold text-white">{profile.nombre_completo}</h2>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><p className="muted">Titular</p><p>{ficha?.titular_parcela || profile.nombre_completo || '—'}</p></div>
          <div><p className="muted">RUT titular</p><p>{ficha?.rut_titular ? formatRut(ficha.rut_titular) : profile.rut ? formatRut(profile.rut) : '—'}</p></div>
          <div><p className="muted">Número de rol</p><p>{ficha?.numero_rol_parcela || '—'}</p></div>
          <div><p className="muted">Parcela</p><p>{ficha?.parcela || profile.parcela || '—'}</p></div>
          <div><p className="muted">Estado contractual</p><p>{contractStatus || 'Sin definir'}</p></div>
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
