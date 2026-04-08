"use client";

import { useMemo, useState } from 'react';

import { SolicitudStatusForm } from '@/components/admin/solicitud-status-form';
import { AddSolicitudMessageForm } from '@/components/dashboard/add-solicitud-message-form';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/format';
import type { SolicitudEstado, SolicitudTipo } from '@/lib/types';

type SolicitudItem = {
  id: string;
  perfil_id: string;
  asunto: string;
  detalle_inicial: string;
  tipo: SolicitudTipo;
  estado: SolicitudEstado;
  created_at: string;
  updated_at: string;
  clienteNombre: string;
  parcela: string | null;
  numeroRol: string | null;
};

type MensajeItem = {
  id: string;
  solicitud_id: string;
  mensaje: string;
  es_interno: boolean;
  created_at: string;
};

type TabKey = 'pendientes' | 'abiertas' | 'cerradas';

const tabLabels: Record<TabKey, string> = {
  pendientes: 'Pendientes',
  abiertas: 'Abiertas',
  cerradas: 'Cerradas'
};

function getUrgencyRank(estado: SolicitudEstado) {
  if (estado === 'abierta') return 0;
  if (estado === 'en_revision') return 1;
  if (estado === 'respondida') return 2;
  if (estado === 'aprobada') return 3;
  if (estado === 'rechazada') return 4;
  return 5;
}

function matchesTab(estado: SolicitudEstado, tab: TabKey) {
  if (tab === 'pendientes') return estado === 'abierta' || estado === 'en_revision';
  if (tab === 'cerradas') return estado === 'cerrada';
  return estado !== 'cerrada';
}

function orderSolicitudes(items: SolicitudItem[]) {
  return [...items].sort((a, b) => {
    const rankDiff = getUrgencyRank(a.estado) - getUrgencyRank(b.estado);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export function SolicitudesBoard({
  solicitudes,
  mensajes,
  accent = 'amber',
  title,
  emptyLabel = 'No hay casos cargados.'
}: {
  solicitudes: SolicitudItem[];
  mensajes: MensajeItem[];
  accent?: 'amber' | 'sky';
  title: string;
  emptyLabel?: string;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('pendientes');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => ({
    pendientes: solicitudes.filter((item) => matchesTab(item.estado, 'pendientes')).length,
    abiertas: solicitudes.filter((item) => matchesTab(item.estado, 'abiertas')).length,
    cerradas: solicitudes.filter((item) => matchesTab(item.estado, 'cerradas')).length
  }), [solicitudes]);

  const filtered = useMemo(
    () => orderSolicitudes(solicitudes.filter((item) => matchesTab(item.estado, activeTab))),
    [solicitudes, activeTab]
  );

  const selected = selectedId
    ? filtered.find((item) => item.id === selectedId) ?? solicitudes.find((item) => item.id === selectedId) ?? null
    : null;
  const thread = selected ? mensajes.filter((item) => item.solicitud_id === selected.id) : [];
  const titleColor = accent === 'sky' ? 'text-sky-300' : 'text-amber-300';
  const tabActiveClasses = accent === 'sky'
    ? 'border-sky-300/35 bg-sky-400/10 text-sky-200'
    : 'border-amber-300/35 bg-amber-400/10 text-amber-100';

  return (
    <section className="card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={`text-sm font-bold uppercase tracking-[0.22em] ${titleColor}`}>{title}</p>
          <p className="muted mt-2 text-sm">Las solicitudes por responder quedan arriba. Las cerradas se separan en su propia pestaña.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['pendientes', 'abiertas', 'cerradas'] as TabKey[]).map((tab) => (
            <button
              className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${activeTab === tab ? tabActiveClasses : 'border-white/10 bg-slate-950/40 text-slate-200'}`}
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedId(null);
              }}
              type="button"
            >
              {tabLabels[tab]} ({counts[tab]})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
              <th className="px-3 py-3">Fecha</th>
              <th className="px-3 py-3">Cliente</th>
              <th className="px-3 py-3">Parcela</th>
              <th className="px-3 py-3">Asunto</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Última actualización</th>
              <th className="px-3 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((solicitud) => (
              <tr className="border-b border-white/6 last:border-b-0" key={solicitud.id}>
                <td className="px-3 py-4 text-slate-200">{formatDate(solicitud.created_at)}</td>
                <td className="px-3 py-4 text-white">{solicitud.clienteNombre}</td>
                <td className="px-3 py-4 text-slate-200">{solicitud.parcela || '—'}{solicitud.numeroRol ? ` · Rol ${solicitud.numeroRol}` : ''}</td>
                <td className="px-3 py-4 text-slate-200">{solicitud.asunto}</td>
                <td className="px-3 py-4"><StatusBadge label={solicitud.estado} /></td>
                <td className="px-3 py-4 text-slate-200">{formatDate(solicitud.updated_at)}</td>
                <td className="px-3 py-4 text-right">
                  <button className="btn btn-secondary w-full lg:w-fit" onClick={() => setSelectedId(solicitud.id)} type="button">
                    Ver / atender
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 divide-y divide-white/8 md:hidden">
        {filtered.map((solicitud) => (
          <article className="py-3" key={solicitud.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-white">{solicitud.asunto}</h3>
                <p className="muted mt-1 text-sm">{solicitud.clienteNombre}</p>
                <p className="muted mt-1 text-sm">Parcela: <span className="text-slate-200">{solicitud.parcela || '—'}</span></p>
                <p className="muted mt-1 text-sm">{formatDate(solicitud.created_at)}</p>
              </div>
              <StatusBadge label={solicitud.estado} />
            </div>
            <div className="mt-3">
              <button className="btn btn-secondary w-full" onClick={() => setSelectedId(solicitud.id)} type="button">
                Ver / atender
              </button>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? <p className="muted mt-4 text-sm">{emptyLabel}</p> : null}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 p-0 sm:items-center sm:p-4">
          <div className="card relative max-h-[92vh] min-h-[70vh] w-full overflow-hidden rounded-t-3xl border border-white/10 bg-slate-950 sm:min-h-0 sm:max-w-5xl sm:rounded-3xl">
            <button
              aria-label="Cerrar"
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-slate-900/90 px-3 py-2 text-sm font-semibold text-slate-200"
              onClick={() => setSelectedId(null)}
              type="button"
            >
              Cerrar
            </button>

            <div className="max-h-[92vh] overflow-y-auto p-5 sm:p-6">
              <div className="pr-16">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{selected.clienteNombre}</p>
                    <h3 className="mt-2 text-xl font-bold text-white">{selected.asunto}</h3>
                    <p className="muted mt-2 text-sm">{selected.parcela || 'Sin parcela'}{selected.numeroRol ? ` · Rol ${selected.numeroRol}` : ''} · {selected.tipo} · {formatDate(selected.created_at)}</p>
                  </div>
                  <StatusBadge label={selected.estado} />
                </div>
                <div className="mt-4 rounded-2xl border border-white/8 bg-slate-900/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Detalle inicial</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-200">{selected.detalle_inicial}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-300">Historial</p>
                  <div className="mt-3 grid gap-3">
                    {thread.map((mensaje) => (
                      <div className={`rounded-2xl border p-3 text-sm ${mensaje.es_interno ? 'border-amber-300/20 bg-amber-400/10 text-amber-100' : 'border-white/8 bg-slate-950/50 text-slate-200'}`} key={mensaje.id}>
                        <p className="muted text-xs">{formatDate(mensaje.created_at)} {mensaje.es_interno ? '· interno' : ''}</p>
                        <p className="mt-2 whitespace-pre-wrap break-words">{mensaje.mensaje}</p>
                      </div>
                    ))}
                    {thread.length === 0 ? <p className="muted text-sm">Todavía no hay respuestas en este caso.</p> : null}
                  </div>
                </div>

                <div className="grid gap-5">
                  <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-300">Responder</p>
                    <div className="mt-3">
                      <AddSolicitudMessageForm internal solicitudId={selected.id} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-300">Estado del caso</p>
                    <div className="mt-3">
                      <SolicitudStatusForm currentStatus={selected.estado} solicitudId={selected.id} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
