"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateSolicitudForm() {
  const router = useRouter();
  const [tipo, setTipo] = useState<'consulta' | 'indicacion' | 'solicitud'>('consulta');
  const [asunto, setAsunto] = useState('');
  const [detalle, setDetalle] = useState('');
  const [prioridad, setPrioridad] = useState<'baja' | 'media' | 'alta'>('media');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, asunto, detalle_inicial: detalle, prioridad })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo crear el caso.');
      setAsunto('');
      setDetalle('');
      setPrioridad('media');
      setTipo('consulta');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el caso.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card grid gap-4 p-5" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Consultas e indicaciones</p>
        <h3 className="mt-2 text-xl font-bold text-white">Abrir un caso</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2"><label className="label">Tipo</label><select className="select" value={tipo} onChange={(e) => setTipo(e.target.value as 'consulta' | 'indicacion' | 'solicitud')}><option value="consulta">Consulta</option><option value="indicacion">Indicación</option><option value="solicitud">Solicitud</option></select></div>
        <div className="space-y-2"><label className="label">Prioridad</label><select className="select" value={prioridad} onChange={(e) => setPrioridad(e.target.value as 'baja' | 'media' | 'alta')}><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option></select></div>
        <div className="space-y-2 md:col-span-3"><label className="label">Asunto</label><input className="input" value={asunto} onChange={(e) => setAsunto(e.target.value)} /></div>
        <div className="space-y-2 md:col-span-3"><label className="label">Detalle</label><textarea className="textarea" value={detalle} onChange={(e) => setDetalle(e.target.value)} /></div>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Enviando...' : 'Enviar caso'}</button>
    </form>
  );
}
