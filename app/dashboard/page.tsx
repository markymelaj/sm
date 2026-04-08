import { AddSolicitudMessageForm } from '@/components/dashboard/add-solicitud-message-form';
import { CreateSolicitudForm } from '@/components/dashboard/create-solicitud-form';
import { SimulatePaymentButton } from '@/components/dashboard/simulate-payment-button';
import { StatusBadge } from '@/components/status-badge';
import { UploadComprobanteForm } from '@/components/dashboard/upload-comprobante-form';
import { formatCurrency, formatDate } from '@/lib/format';
import { requireRole } from '@/lib/auth';
import { formatRut } from '@/lib/rut';

export default async function ClientDashboardPage() {
  const { supabase, profile } = await requireRole(['cliente']);

  const [{ data: fichaData }, { data: seguimientoData }, { data: cuotasData }, { data: avancesData }, { data: solicitudesData }, { data: estadoTiposData }] = await Promise.all([
    supabase.from('fichas_cliente').select('*').eq('perfil_id', profile.id).maybeSingle(),
    supabase.from('seguimiento_parcela').select('*').eq('perfil_id', profile.id).maybeSingle(),
    supabase.from('cuotas').select('*').eq('perfil_id', profile.id).order('fecha_vencimiento', { ascending: true }),
    supabase.from('avances_obra').select('*').order('fecha', { ascending: false }).limit(8),
    supabase.from('solicitudes').select('*').eq('perfil_id', profile.id).order('created_at', { ascending: false }),
    supabase.from('ficha_estado_tipos').select('*').eq('is_active', true).order('sort_order', { ascending: true })
  ]);

  const ficha: any = fichaData;
  const seguimiento: any = seguimientoData;
  const cuotas: any[] = cuotasData ?? [];
  const avances: any[] = avancesData ?? [];
  const solicitudes: any[] = solicitudesData ?? [];
  const estadoTipos: any[] = estadoTiposData ?? [];

  const estadoValues: any[] = ficha
    ? (await supabase.from('ficha_estado_valores').select('*').eq('ficha_id', ficha.id)).data ?? []
    : [];

  const solicitudIds = solicitudes.map((item) => item.id);
  const solicitudMessages: any[] = solicitudIds.length
    ? ((await supabase.from('solicitud_mensajes').select('*').in('solicitud_id', solicitudIds).order('created_at', { ascending: true })).data ?? [])
    : [];

  const nextQuota = cuotas.find((item) => item.estado !== 'pagado') ?? null;

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

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Próxima cuota</p><h2 className="mt-2 text-2xl font-bold text-white">{nextQuota ? formatCurrency(nextQuota.monto_total) : 'Sin deuda próxima'}</h2><p className="muted mt-2 text-sm">{nextQuota ? `Vence el ${formatDate(nextQuota.fecha_vencimiento)}` : 'No hay cuotas pendientes.'}</p></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Mi acceso</p><h2 className="mt-2 text-2xl font-bold text-white">{profile.nombre_completo}</h2><p className="muted mt-2 break-words text-sm">Identificador: {profile.rut ? formatRut(profile.rut) : profile.identificador.toLowerCase()}</p></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Seguimiento parcela</p><h2 className="mt-2 text-2xl font-bold text-white">{seguimiento?.avance_particular ? 'Actualizado' : 'Sin detalle'}</h2><p className="muted mt-2 text-sm">El texto de seguimiento particular lo actualiza la administración.</p></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <div className="card p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Mi ficha</p>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><p className="muted">Titular</p><p className="break-words text-white">{ficha?.titular_parcela || '—'}</p></div>
              <div><p className="muted">RUT titular</p><p className="break-words text-white">{ficha?.rut_titular ? formatRut(ficha.rut_titular) : '—'}</p></div>
              <div><p className="muted">Rol parcela</p><p className="break-words text-white">{ficha?.numero_rol_parcela || '—'}</p></div>
              <div><p className="muted">Número parcela</p><p className="break-words text-white">{ficha?.numero_parcela || '—'}</p></div>
              <div><p className="muted">Parcela</p><p className="break-words text-white">{ficha?.parcela || profile.parcela || '—'}</p></div>
              <div><p className="muted">Teléfono</p><p className="break-words text-white">{ficha?.telefono || '—'}</p></div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/8 bg-slate-900/50 p-4">
              <p className="muted text-xs uppercase tracking-[0.2em]">Seguimiento particular</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-white">{seguimiento?.avance_particular || 'Sin observaciones particulares por ahora.'}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {estadoTipos.map((tipo) => {
                const value = estadoValues.find((item) => item.estado_tipo_id === tipo.id);
                const renderValue = tipo.tipo_input === 'boolean'
                  ? value?.valor_bool ? 'Sí' : 'No'
                  : tipo.tipo_input === 'date'
                    ? formatDate(value?.valor_fecha)
                    : value?.valor_texto || '—';
                return (
                  <div className="rounded-2xl border border-white/8 bg-slate-900/40 p-4" key={tipo.id}>
                    <p className="text-sm font-bold text-white">{tipo.etiqueta}</p>
                    <p className="mt-1 break-words text-sm text-slate-200">{renderValue}</p>
                    {value?.observacion ? <p className="muted mt-2 text-xs break-words">{value.observacion}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Mis pagos</p>
            <div className="mt-4 grid gap-4">
              {cuotas.map((cuota) => (
                <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={cuota.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-bold text-white">{cuota.concepto}</h3>
                      <p className="muted text-sm">Vence el {formatDate(cuota.fecha_vencimiento)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2"><StatusBadge label={cuota.estado} /></div>
                  </div>
                  <p className="mt-3 text-xl font-bold text-white">{formatCurrency(cuota.monto_total)}</p>
                  {cuota.motivo_rechazo ? <p className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-200">Motivo de rechazo: {cuota.motivo_rechazo}</p> : null}
                  {comprobanteUrls[cuota.id] ? <a className="mt-3 inline-flex text-sm font-semibold text-sky-300 underline" href={comprobanteUrls[cuota.id]!} rel="noreferrer" target="_blank">Ver comprobante cargado</a> : null}
                  {(cuota.estado === 'pendiente' || cuota.estado === 'rechazado') ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <UploadComprobanteForm cuotaId={cuota.id} />
                      <SimulatePaymentButton cuotaId={cuota.id} />
                    </div>
                  ) : null}
                </article>
              ))}
              {cuotas.length === 0 ? <p className="muted text-sm">Aún no hay cuotas cargadas.</p> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="card p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Avances generales</p>
            <div className="mt-4 grid gap-4">
              {avances.map((avance) => (
                <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={avance.id}>
                  <p className="text-sm font-bold text-white">{avance.titulo}</p>
                  <p className="muted mt-1 text-xs">{formatDate(avance.fecha)}</p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-200">{avance.descripcion}</p>
                </article>
              ))}
              {avances.length === 0 ? <p className="muted text-sm">Todavía no hay publicaciones generales.</p> : null}
            </div>
          </div>

          <CreateSolicitudForm />

          <div className="card p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Mis casos</p>
            <div className="mt-4 grid gap-4">
              {solicitudes.map((solicitud) => {
                const messages = solicitudMessages.filter((item) => item.solicitud_id === solicitud.id && !item.es_interno);
                return (
                  <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={solicitud.id}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-bold text-white">{solicitud.asunto}</h3>
                        <p className="muted text-sm">{solicitud.tipo} · {formatDate(solicitud.created_at)}</p>
                      </div>
                      <StatusBadge label={solicitud.estado} />
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-200">{solicitud.detalle_inicial}</p>
                    {solicitud.motivo_rechazo ? <p className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-200">Motivo: {solicitud.motivo_rechazo}</p> : null}
                    <div className="mt-4 grid gap-3">
                      {messages.map((message) => (
                        <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-3 text-sm text-slate-200" key={message.id}>
                          <p className="muted text-xs">{formatDate(message.created_at)}</p>
                          <p className="mt-2 whitespace-pre-wrap break-words">{message.mensaje}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4"><AddSolicitudMessageForm solicitudId={solicitud.id} /></div>
                  </article>
                );
              })}
              {solicitudes.length === 0 ? <p className="muted text-sm">Todavía no has enviado casos.</p> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
