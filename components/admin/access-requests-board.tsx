"use client";

import { useMemo, useState } from 'react';

import { StatusBadge } from '@/components/status-badge';
import { formatRut } from '@/lib/rut';

function buildAccessMessage(identifier: string, passwordTemporal: string) {
  return [
    'Hola. Tu acceso al Portal Santa Magdalena ya está listo.',
    '',
    'Ingresa aquí:',
    'bit.ly/santamagdalena',
    '',
    `Usuario: ${identifier}`,
    `Contraseña: ${passwordTemporal}`,
    '',
    'En tu primer ingreso el sistema te pedirá cambiar tu contraseña.',
    'Dentro del portal podrás revisar tu información, cargar pagos y comprobantes, y enviarnos consultas o solicitudes.',
    '',
    'Saludos.'
  ].join('\n');
}

export function AccessRequestsBoard({ initialRequests }: { initialRequests: any[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<'pendiente' | 'aprobada' | 'rechazada'>('pendiente');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  const visibleRequests = useMemo(
    () => requests.filter((item) => item.estado === filter),
    [requests, filter]
  );

  async function copyResult() {
    if (!resultMessage) return;
    try {
      await navigator.clipboard.writeText(resultMessage);
      setCopyMessage('Mensaje copiado.');
    } catch {
      setCopyMessage('No se pudo copiar automáticamente.');
    }
  }

  async function approve(id: string) {
    setLoadingId(id);
    setError('');
    setCopyMessage('');
    try {
      const response = await fetch(`/api/admin/access-requests/${id}/approve`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo aprobar la solicitud.');

      setRequests((current) => current.map((item) => item.id === id ? { ...item, estado: 'aprobada', processed_at: new Date().toISOString() } : item));
      setResultMessage(buildAccessMessage(payload.credentials.identificador, payload.credentials.passwordTemporal));
      setFilter('aprobada');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aprobar la solicitud.');
    } finally {
      setLoadingId(null);
    }
  }

  async function reject(id: string) {
    const reason = window.prompt('Motivo del rechazo (opcional):', '');
    if (reason === null) return;
    setLoadingId(id);
    setError('');
    try {
      const response = await fetch(`/api/admin/access-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacion_admin: reason })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo rechazar la solicitud.');

      setRequests((current) => current.map((item) => item.id === id ? { ...item, estado: 'rechazada', observacion_admin: reason || null, processed_at: new Date().toISOString() } : item));
      if (filter === 'pendiente') setFilter('rechazada');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo rechazar la solicitud.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Solicitudes de acceso</p>
          <p className="muted mt-2 text-sm">Los vecinos pueden solicitar acceso con sus datos mínimos. Aquí apruebas o rechazas cada caso.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['pendiente', 'aprobada', 'rechazada'] as const).map((item) => (
            <button
              className={`btn ${filter === item ? 'btn-primary' : 'btn-secondary'}`}
              key={item}
              onClick={() => setFilter(item)}
              type="button"
            >
              {item === 'pendiente' ? 'Pendientes' : item === 'aprobada' ? 'Aprobadas' : 'Rechazadas'}
            </button>
          ))}
        </div>
      </div>

      {resultMessage ? (
        <div className="mt-5 rounded-2xl border border-white/8 bg-slate-950/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Acceso generado</p>
            <button className="btn btn-secondary w-full sm:w-fit" onClick={copyResult} type="button">Copiar mensaje</button>
          </div>
          <textarea className="textarea mt-3 min-h-[210px]" readOnly value={resultMessage} />
          {copyMessage ? <p className="mt-2 text-xs text-sky-300">{copyMessage}</p> : null}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-5 overflow-x-auto hidden md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
              <th className="px-3 py-3">Fecha</th>
              <th className="px-3 py-3">Titular</th>
              <th className="px-3 py-3">RUT</th>
              <th className="px-3 py-3">Parcela</th>
              <th className="px-3 py-3">Teléfono</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {visibleRequests.map((item) => (
              <tr className="border-b border-white/6 last:border-b-0" key={item.id}>
                <td className="px-3 py-4 text-slate-200">{new Date(item.created_at).toLocaleDateString('es-CL')}</td>
                <td className="px-3 py-4 text-white">{item.nombre_completo}</td>
                <td className="px-3 py-4 text-slate-200">{formatRut(item.rut)}</td>
                <td className="px-3 py-4 text-slate-200">{item.parcela}</td>
                <td className="px-3 py-4 text-slate-200">{item.telefono}</td>
                <td className="px-3 py-4"><StatusBadge label={item.estado} /></td>
                <td className="px-3 py-4">
                  {item.estado === 'pendiente' ? (
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-primary" disabled={loadingId === item.id} onClick={() => approve(item.id)} type="button">Aprobar</button>
                      <button className="btn btn-secondary" disabled={loadingId === item.id} onClick={() => reject(item.id)} type="button">Rechazar</button>
                    </div>
                  ) : item.observacion_admin ? <p className="muted text-xs">{item.observacion_admin}</p> : <span className="muted text-xs">Resuelto</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 divide-y divide-white/8 md:hidden">
        {visibleRequests.map((item) => (
          <article className="py-3" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-white">{item.nombre_completo}</h3>
                <p className="muted mt-1 text-sm">{formatRut(item.rut)} · {item.parcela}</p>
                <p className="muted mt-1 text-xs">{item.telefono}</p>
              </div>
              <StatusBadge label={item.estado} />
            </div>
            {item.estado === 'pendiente' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn btn-primary w-full" disabled={loadingId === item.id} onClick={() => approve(item.id)} type="button">Aprobar</button>
                <button className="btn btn-secondary w-full" disabled={loadingId === item.id} onClick={() => reject(item.id)} type="button">Rechazar</button>
              </div>
            ) : item.observacion_admin ? <p className="muted mt-3 text-xs">{item.observacion_admin}</p> : null}
          </article>
        ))}
      </div>

      {visibleRequests.length === 0 ? <p className="muted mt-4 text-sm">No hay solicitudes en esta pestaña.</p> : null}
    </section>
  );
}
