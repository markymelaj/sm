import { AddSolicitudMessageForm } from '@/components/dashboard/add-solicitud-message-form';
import { SolicitudStatusForm } from '@/components/admin/solicitud-status-form';
import { StatusBadge } from '@/components/status-badge';
import { requireRole } from '@/lib/auth';
import { formatDate } from '@/lib/format';

export default async function AuditorSolicitudesPage() {
  const { supabase } = await requireRole(['auditor']);
  const { data } = await supabase.from('solicitudes').select('*, perfiles(nombre_completo)').order('updated_at', { ascending: false });
  const solicitudes: any[] = data ?? [];
  const solicitudIds = solicitudes.map((item) => item.id);
  const mensajes: any[] = solicitudIds.length ? ((await supabase.from('solicitud_mensajes').select('*').in('solicitud_id', solicitudIds).order('created_at', { ascending: true })).data ?? []) : [];

  return (
    <section className="card p-5">
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Solicitudes</p>
      <div className="mt-4 grid gap-4">
        {solicitudes.map((solicitud: any) => {
          const thread = mensajes.filter((item) => item.solicitud_id === solicitud.id);
          return (
            <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={solicitud.id}>
              <div className="flex flex-col gap-3 xl:flex-row xl:justify-between"><div><h3 className="text-lg font-bold text-white">{solicitud.asunto}</h3><p className="muted text-sm">{solicitud.perfiles?.nombre_completo || 'Cliente'} · {solicitud.tipo} · {formatDate(solicitud.created_at)}</p></div><StatusBadge label={solicitud.estado} /></div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-200">{solicitud.detalle_inicial}</p>
              <div className="mt-4 grid gap-3">{thread.map((mensaje) => <div className={`rounded-2xl border p-3 text-sm ${mensaje.es_interno ? 'border-amber-300/20 bg-amber-400/10 text-amber-100' : 'border-white/8 bg-slate-950/50 text-slate-200'}`} key={mensaje.id}><p className="muted text-xs">{formatDate(mensaje.created_at)} {mensaje.es_interno ? '· interno' : ''}</p><p className="mt-2 whitespace-pre-wrap break-words">{mensaje.mensaje}</p></div>)}</div>
              <div className="mt-4 grid gap-4 xl:grid-cols-2"><AddSolicitudMessageForm internal solicitudId={solicitud.id} /><SolicitudStatusForm currentStatus={solicitud.estado} solicitudId={solicitud.id} /></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
