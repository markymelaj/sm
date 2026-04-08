import Link from 'next/link';

import { ApproveRejectControls } from '@/components/admin/approve-reject-controls';
import { CreateQuotaForm } from '@/components/admin/create-quota-form';
import { EditClientForm } from '@/components/admin/edit-client-form';
import { EditFichaForm } from '@/components/admin/edit-ficha-form';
import { EditQuotaForm } from '@/components/admin/edit-quota-form';
import { EditSeguimientoForm } from '@/components/admin/edit-seguimiento-form';
import { EstadoValorEditor } from '@/components/admin/estado-valor-editor';
import { ManualApproveButton } from '@/components/admin/manual-approve-button';
import { ResetPasswordButton } from '@/components/admin/reset-password-button';
import { AddSolicitudMessageForm } from '@/components/dashboard/add-solicitud-message-form';
import { SolicitudStatusForm } from '@/components/admin/solicitud-status-form';
import { StatusBadge } from '@/components/status-badge';
import { requireRole } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/format';
import { getNextQuota, getPaidTotal, getPendingBalance, PROJECT_TOTAL } from '@/lib/payments';
import { buildContractStatusMap } from '@/lib/contracts';

export default async function AdminClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireRole(['admin']);
  const { id } = await Promise.resolve(params);

  const [{ data: profileData }, { data: fichaData }, { data: seguimientoData }, { data: cuotasData }, { data: solicitudesData }, { data: estadoTiposData }] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', id).single(),
    supabase.from('fichas_cliente').select('*').eq('perfil_id', id).maybeSingle(),
    supabase.from('seguimiento_parcela').select('*').eq('perfil_id', id).maybeSingle(),
    supabase.from('cuotas').select('*').eq('perfil_id', id).order('fecha_vencimiento', { ascending: true }),
    supabase.from('solicitudes').select('*').eq('perfil_id', id).order('created_at', { ascending: false }),
    supabase.from('ficha_estado_tipos').select('*').eq('is_active', true).order('sort_order', { ascending: true })
  ]);

  const profile: any = profileData;
  const ficha: any = fichaData;
  const seguimiento: any = seguimientoData;
  const cuotas: any[] = cuotasData ?? [];
  const solicitudes: any[] = solicitudesData ?? [];
  const estadoTipos: any[] = estadoTiposData ?? [];

  const totalPagado = getPaidTotal(cuotas as any);
  const saldoPendiente = getPendingBalance(cuotas as any);
  const nextQuota = getNextQuota(cuotas as any);

  const estadoValues: any[] = ficha ? ((await supabase.from('ficha_estado_valores').select('*').eq('ficha_id', ficha.id)).data ?? []) : [];
  const contractStatus = ficha ? buildContractStatusMap([{ id: ficha.id, perfil_id: profile.id }], estadoTipos, estadoValues).get(profile.id) ?? null : null;

  const comprobanteUrls = Object.fromEntries(
    await Promise.all(
      cuotas
        .filter((item) => item.comprobante_url)
        .map(async (item) => {
          const { data } = await supabase.storage.from('comprobantes').createSignedUrl(item.comprobante_url as string, 3600);
          return [item.id, data?.signedUrl ?? null];
        })
    )
  );

  const solicitudIds = solicitudes.map((item) => item.id);
  const mensajes: any[] = solicitudIds.length ? ((await supabase.from('solicitud_mensajes').select('*').in('solicitud_id', solicitudIds).order('created_at', { ascending: true })).data ?? []) : [];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-3"><Link className="btn btn-secondary" href="/admin/clientes">Volver</Link></div>

      {profile.rol === 'cliente' ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Valor total</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(PROJECT_TOTAL)}</h2></div>
          <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Pagado</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(totalPagado)}</h2></div>
          <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Saldo pendiente</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(saldoPendiente)}</h2></div>
          <div className="card p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Próximo pago</p>
            <h2 className="mt-2 text-xl font-bold text-white">{nextQuota ? formatCurrency(nextQuota.monto_total) : 'Sin próximos pagos'}</h2>
            <p className="muted mt-2 text-sm">{nextQuota ? `Fecha de pago: ${formatDate(nextQuota.fecha_vencimiento)}` : 'No hay cuotas pendientes.'}</p>
            {nextQuota ? <div className="mt-3"><StatusBadge label={nextQuota.estado} /></div> : null}
          </div>
          <div className="card p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Estado contractual</p>
            <h2 className="mt-2 text-xl font-bold text-white">{contractStatus || 'Sin definir'}</h2>
            <p className="muted mt-2 text-sm">Úsalo para seguimiento de notaría, firma y retiro.</p>
          </div>
        </section>
      ) : null}

      <EditClientForm profile={profile} />
      {profile.rol === 'cliente' ? <EditFichaForm ficha={ficha} profileId={profile.id} /> : null}
      {profile.rol === 'cliente' ? <EditSeguimientoForm avanceParticular={seguimiento?.avance_particular ?? ''} profileId={profile.id} /> : null}
      {profile.rol === 'cliente' && ficha ? (
        <section className="card grid gap-4 p-5">
          <div><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Estados parametrizados</p><h3 className="mt-2 text-xl font-bold text-white">Checklist editable</h3></div>
          <div className="grid gap-4 lg:grid-cols-2">
            {estadoTipos.map((tipo) => <EstadoValorEditor key={tipo.id} estadoTipo={tipo} fichaId={ficha.id} profileId={profile.id} valor={estadoValues.find((item) => item.estado_tipo_id === tipo.id)} />)}
          </div>
        </section>
      ) : null}
      <ResetPasswordButton userId={profile.id} />
      {profile.rol === 'cliente' ? <CreateQuotaForm profileId={profile.id} /> : null}

      {profile.rol === 'cliente' ? (
        <section className="card p-5">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Pagos y próximas cuotas</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {cuotas.map((cuota) => (
              <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={cuota.id}>
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-white">{cuota.concepto}</h3><p className="muted text-sm">Fecha de pago {formatDate(cuota.fecha_vencimiento)}</p></div><StatusBadge label={cuota.estado} /></div>
                <p className="mt-3 text-xl font-bold text-white">{formatCurrency(cuota.monto_total)}</p>
                {cuota.motivo_rechazo ? <p className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-200">Motivo: {cuota.motivo_rechazo}</p> : null}
                {comprobanteUrls[cuota.id] ? <a className="mt-3 inline-flex text-sm font-semibold text-sky-300 underline" href={comprobanteUrls[cuota.id]!} rel="noreferrer" target="_blank">Abrir comprobante</a> : null}
                <div className="mt-4 grid gap-4"><ApproveRejectControls quotaId={cuota.id} /><ManualApproveButton quotaId={cuota.id} /><EditQuotaForm quota={cuota} /></div>
              </article>
            ))}
            {cuotas.length === 0 ? <p className="muted text-sm">No hay pagos cargados.</p> : null}
          </div>
        </section>
      ) : null}

      {profile.rol === 'cliente' ? (
        <section className="card p-5">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Solicitudes del cliente</p>
          <div className="mt-4 grid gap-4">
            {solicitudes.map((solicitud) => {
              const thread = mensajes.filter((item) => item.solicitud_id === solicitud.id);
              return (
                <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={solicitud.id}>
                  <div className="flex flex-col gap-3 xl:flex-row xl:justify-between">
                    <div><h3 className="text-lg font-bold text-white">{solicitud.asunto}</h3><p className="muted text-sm">{solicitud.tipo} · {formatDate(solicitud.created_at)}</p></div>
                    <StatusBadge label={solicitud.estado} />
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-200">{solicitud.detalle_inicial}</p>
                  <div className="mt-4"><SolicitudStatusForm solicitudId={solicitud.id} currentStatus={solicitud.estado} /></div>
                  <div className="mt-4 grid gap-3">
                    {thread.map((mensaje) => (
                      <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-3 text-sm text-slate-200" key={mensaje.id}>
                        <p className="muted text-xs">{formatDate(mensaje.created_at)}</p>
                        <p className="mt-2 whitespace-pre-wrap break-words">{mensaje.mensaje}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4"><AddSolicitudMessageForm solicitudId={solicitud.id} /></div>
                </article>
              );
            })}
            {solicitudes.length === 0 ? <p className="muted text-sm">No hay solicitudes registradas.</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
