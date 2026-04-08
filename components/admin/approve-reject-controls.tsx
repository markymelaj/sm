"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ApproveRejectControls({ quotaId }: { quotaId: string }) {
  const router = useRouter();
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function approve() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/cuotas/${quotaId}/approve`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo aprobar.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aprobar.');
    } finally {
      setLoading(false);
    }
  }

  async function reject() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/cuotas/${quotaId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo rechazar.');
      setMotivo('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo rechazar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" disabled={loading} onClick={approve} type="button">Aprobar</button>
        <button className="btn btn-danger" disabled={loading || !motivo.trim()} onClick={reject} type="button">Rechazar</button>
      </div>
      <input className="input" placeholder="Motivo de rechazo" value={motivo} onChange={(event) => setMotivo(event.target.value)} />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
