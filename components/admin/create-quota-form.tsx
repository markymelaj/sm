"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateQuotaForm({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/clientes/${profileId}/cuotas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concepto, monto_total: Number(monto), fecha_vencimiento: fecha })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo crear la cuota.');
      setConcepto('');
      setMonto('');
      setFecha('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuota.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card grid gap-4 p-5" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Cuotas</p>
        <h3 className="mt-2 text-xl font-bold text-white">Crear cuota</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-3"><label className="label">Concepto</label><input className="input" value={concepto} onChange={(e) => setConcepto(e.target.value)} /></div>
        <div className="space-y-2"><label className="label">Monto</label><input className="input" inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value)} /></div>
        <div className="space-y-2"><label className="label">Vencimiento</label><input className="input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Creando...' : 'Crear cuota'}</button>
    </form>
  );
}
