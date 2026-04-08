"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function EditSeguimientoForm({ profileId, avanceParticular }: { profileId: string; avanceParticular: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(avanceParticular ?? '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`/api/admin/clientes/${profileId}/seguimiento`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avance_particular: value })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo guardar el seguimiento.');
      setMessage('Seguimiento actualizado.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el seguimiento.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card grid gap-4 p-5" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Seguimiento particular</p>
        <h3 className="mt-2 text-xl font-bold text-white">Texto visible para esta parcela</h3>
      </div>
      <textarea className="textarea" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Ejemplo: posteado revisado, acceso por portón derecho, visita técnica pendiente..." />
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Guardando...' : 'Guardar seguimiento'}</button>
    </form>
  );
}
