"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AddSolicitudMessageForm({ solicitudId, internal = false }: { solicitudId: string; internal?: boolean }) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState('');
  const [esInterno, setEsInterno] = useState(internal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mensaje.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, es_interno: esInterno })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo enviar el mensaje.');
      setMensaje('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <textarea className="textarea" value={mensaje} onChange={(event) => setMensaje(event.target.value)} placeholder="Escribe tu mensaje" />
      {internal ? (
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input checked={esInterno} onChange={(event) => setEsInterno(event.target.checked)} type="checkbox" />
          Mensaje interno
        </label>
      ) : null}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <button className="btn btn-secondary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Enviando...' : 'Enviar mensaje'}</button>
    </form>
  );
}
