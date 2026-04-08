"use client";

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import type { Database } from '@/lib/types';

type Quota = Database['public']['Tables']['cuotas']['Row'];

export function EditQuotaForm({ quota }: { quota: Quota }) {
  const router = useRouter();
  const [concepto, setConcepto] = useState(quota.concepto);
  const [monto, setMonto] = useState(String(quota.monto_total));
  const [fecha, setFecha] = useState(quota.fecha_vencimiento);
  const [estado, setEstado] = useState(quota.estado);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`/api/admin/cuotas/${quota.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concepto,
          monto_total: Number(monto),
          fecha_vencimiento: fecha,
          estado
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo actualizar el pago.');
      setMessage('Pago actualizado.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el pago.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <details className="mt-4 rounded-2xl border border-white/8 bg-slate-950/40 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-sky-300">Editar pago</summary>
      <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="label">Concepto</label>
            <input className="input" value={concepto} onChange={(event) => setConcepto(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="label">Monto</label>
            <input className="input" inputMode="numeric" value={monto} onChange={(event) => setMonto(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="label">Fecha de pago</label>
            <input className="input" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="label">Estado</label>
            <select className="select" value={estado} onChange={(event) => setEstado(event.target.value as Quota['estado'])}>
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En revisión</option>
              <option value="pagado">Pagado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
        </div>
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button className="btn btn-secondary w-full sm:w-fit" disabled={loading} type="submit">
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </details>
  );
}
