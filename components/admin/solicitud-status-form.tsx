"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { SolicitudEstado } from '@/lib/types';

export function SolicitudStatusForm({ solicitudId, currentStatus }: { solicitudId: string; currentStatus: SolicitudEstado }) {
  const router = useRouter();
  const [estado, setEstado] = useState<SolicitudEstado>(currentStatus);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}/estado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, motivo_rechazo: motivo })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo actualizar el estado.');
      setMotivo('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <select className="select" value={estado} onChange={(event) => setEstado(event.target.value as SolicitudEstado)}>
        <option value="abierta">Abierta</option>
        <option value="en_revision">En revisión</option>
        <option value="respondida">Respondida</option>
        <option value="aprobada">Aprobada</option>
        <option value="rechazada">Rechazada</option>
        <option value="cerrada">Cerrada</option>
      </select>
      <input className="input" placeholder="Motivo de rechazo si aplica" value={motivo} onChange={(event) => setMotivo(event.target.value)} />
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <button className="btn btn-secondary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Guardando...' : 'Guardar estado'}</button>
    </form>
  );
}
