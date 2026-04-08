import Link from 'next/link';

import { AddSolicitudMessageForm } from '@/components/dashboard/add-solicitud-message-form';
import { CreateSolicitudForm } from '@/components/dashboard/create-solicitud-form';
import { StatusBadge } from '@/components/status-badge';
import { UploadComprobanteForm } from '@/components/dashboard/upload-comprobante-form';
import { formatCurrency, formatDate } from '@/lib/format';
import { requireRole } from '@/lib/auth';
import { CARD_PAYMENT_MESSAGE, getNextQuota, getPaidTotal, getPendingBalance, PROJECT_TOTAL, TRANSFER_DETAILS } from '@/lib/payments';
import { formatRut } from '@/lib/rut';

export default async function ClientDashboardPage() {
  const { supabase, profile } = await requireRole(['cliente']);

  const [{ data: fichaData }, { data: seguimientoData }, { data: cuotasData }, { data: avancesData }, { data: solicitudesData }, { data: estadoTiposData }] = await Promise.all([
    supabase.from('fichas_cliente').select('*').eq('perfil_id', profile.id).maybeSingle(),
    supabase.from('seguimiento_parcela').select('*').eq('perfil_id', profile.id).maybeSingle(),
    supabase.from('cuotas').select('*').eq('perfil_id', profile.id).order('fecha_vencimiento', { ascending: true }),
    supabase.from('avances_obra').select('*').order('fecha', { ascending: false }).limit(10),
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

  const nextQuota = getNextQuota(cuotas as any);
  const totalPagado = getPaidTotal(cuotas as any);
  const saldoPendiente = getPendingBalance(cuotas as any);
  const cuotasPendientes = cuotas.filter((item) => item.estado !== 'pagado');
  const cuotasPagadas = cuotas.filter((item) => item.estado === 'pagado');

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

  const titularNombre = ficha?.titular_parcela || profile.nombre_completo || 'Titular';

  return (
    <div className="grid gap-6">
      <section className="card p-5 sm:p-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-sky-300">Portal Santa Magdalena</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Bienvenido</h2>
        <p className="mt-1 break-words text-base font-medium text-slate-100">Titular: {titularNombre}</p>
        <p className="mt-4 text-sm leading-6 text-slate-200">
          En este portal podrás revisar la información de tu parcela, cargar pagos realizados con sus comprobantes,
          seguir avances y novedades de la obra, y enviarnos consultas o solicitudes cuando lo necesites.
        </p>
        <div className="mt-4 rounded-2xl border border-white/8 bg-slate-900/45 p-4 text-sm text-slate-200">
          <p className="font-semibold text-white">Aquí podrás:</p>
          <ul className="mt-3 grid gap-2 pl-5 text-sm text-slate-200 list-disc marker:text-sky-300">
            <li>Cargar pagos realizados y subir sus comprobantes.</li>
            <li>Revisar tu ficha y los datos de tu parcela.</li>
            <li>Ver avances y novedades generales de la obra.</li>
            <li>Hacer consultas o solicitudes relacionadas con tu parcela.</li>
          </ul>
        </div>
        {nextQuota ? (
          <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm text-slate-100">
            <p className="font-semibold text-white">Próxima referencia de pago</p>
            <p className="mt-2">{nextQuota.concepto} · Fecha de pago {formatDate(nextQuota.fecha_vencimiento)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge label={nextQuota.estado} />
              {nextQuota.estado === 'en_revision' ? <span className="text-sm font-semibold text-sky-300">EN REVISIÓN</span> : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Registrar pago</p>
          <p className="mt-2 text-sm text-slate-200">Si ya pagaste o hiciste un abono que todavía no aparece en el portal, regístralo con tu comprobante para revisión.</p>
        </div>
        <Link className="btn btn-primary w-full sm:w-fit" href="/dashboard/registrar-pago">Registrar pago</Link>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-5">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Mi ficha</p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><p className="muted">Titular</p><p className="break-words text-white">{ficha?.titular_parcela || profile.nombre_completo || '—'}</p></div>
            <div><p className="muted">RUT titular</p><p className="break-words text-white">{ficha?.rut_titular ? formatRut(ficha.rut_titular) : profile.rut ? formatRut(profile.rut) : '—'}</p></div>
            <div><p className="muted">Número de rol</p><p className="break-words text-white">{ficha?.numero_rol_parcela || '—'}</p></div>
            <div><p className="muted">Parcela</p><p className="break-words text-white">{ficha?.parcela || profile.parcela || '—'}</p></div>
            <div><p className="muted">Teléfono</p><p className="break-words text-white">{ficha?.telefono || '—'}</p></div>
            <div><p className="muted">Email</p><p className="break-words text-white">{ficha?.email_contacto || profile.email || '—'}</p></div>
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
        </section>

        <section className="card p-5">
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
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="card p-5">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Datos de pago</p>
          <div className="mt-4 rounded-2xl border border-white/8 bg-slate-900/45 p-4 text-sm text-slate-200">
            <p className="font-semibold text-white">Transferencia</p>
            <div className="mt-3 grid gap-1">
              {TRANSFER_DETAILS.map((line) => <p key={line}>{line}</p>)}
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/8 bg-slate-900/45 p-4 text-sm text-slate-200">
            <p className="font-semibold text-white">Tarjeta</p>
            <p className="mt-2">{CARD_PAYMENT_MESSAGE}</p>
            <p className="mt-3 font-semibold text-sky-300">Pagar online: Próximamente</p>
          </div>
        </section>

        <section className="card p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Próximas cuotas</p>
              <p className="muted mt-2 text-sm">Sube tu comprobante cuando corresponda. Pagar online: Próximamente.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4">
            {cuotasPendientes.map((cuota) => (
              <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={cuota.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-white">{cuota.concepto}</h3>
                    <p className="muted text-sm">Fecha de pago {formatDate(cuota.fecha_vencimiento)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label={cuota.estado} />
                    {cuota.estado === 'en_revision' ? <span className="text-sm font-semibold text-sky-300">EN REVISIÓN</span> : null}
                  </div>
                </div>
                <p className="mt-3 text-xl font-bold text-white">{formatCurrency(cuota.monto_total)}</p>
                {cuota.motivo_rechazo ? <p className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-200">Motivo de rechazo: {cuota.motivo_rechazo}</p> : null}
                {comprobanteUrls[cuota.id] ? <a className="mt-3 inline-flex text-sm font-semibold text-sky-300 underline" href={comprobanteUrls[cuota.id]!} rel="noreferrer" target="_blank">Ver comprobante cargado</a> : null}
                {(cuota.estado === 'pendiente' || cuota.estado === 'rechazado') ? (
                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <UploadComprobanteForm cuotaId={cuota.id} />
                    <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4 text-sm text-slate-200">
                      <p className="font-semibold text-white">Pagar online</p>
                      <p className="muted mt-2">Próximamente</p>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
            {cuotasPendientes.length === 0 ? <p className="muted text-sm">No hay cuotas pendientes.</p> : null}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="card p-5">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Pagos registrados</p>
          <div className="mt-4 grid gap-4">
            {cuotasPagadas.map((cuota) => (
              <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={cuota.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-white">{cuota.concepto}</h3>
                    <p className="muted text-sm">Fecha de pago {formatDate(cuota.fecha_vencimiento)}</p>
                  </div>
                  <StatusBadge label={cuota.estado} />
                </div>
                <p className="mt-3 text-xl font-bold text-white">{formatCurrency(cuota.monto_total)}</p>
                {comprobanteUrls[cuota.id] ? <a className="mt-3 inline-flex text-sm font-semibold text-sky-300 underline" href={comprobanteUrls[cuota.id]!} rel="noreferrer" target="_blank">Ver comprobante cargado</a> : null}
              </article>
            ))}
            {cuotasPagadas.length === 0 ? <p className="muted text-sm">Todavía no hay pagos registrados.</p> : null}
          </div>
        </section>

        <section className="grid gap-6">
          <div className="card p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Resumen económico</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Valor total del proyecto</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(PROJECT_TOTAL)}</h2></div>
              <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Total pagado</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(totalPagado)}</h2></div>
              <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Saldo pendiente</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(saldoPendiente)}</h2></div>
              <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Estado actual</p>
                <h2 className="mt-2 text-lg font-bold text-white">{nextQuota ? nextQuota.estado.replaceAll('_', ' ') : 'Al día'}</h2>
                <p className="muted mt-2 text-sm">{nextQuota ? `${nextQuota.concepto} · Fecha de pago ${formatDate(nextQuota.fecha_vencimiento)}` : 'No hay cuotas pendientes por revisar.'}</p>
              </div>
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
        </section>
      </div>
    </div>
  );
}
