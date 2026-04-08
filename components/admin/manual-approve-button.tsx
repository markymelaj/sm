"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ManualApproveButton({ quotaId }: { quotaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    const detail = window.prompt('Detalle de la aprobación manual', 'Aprobado por administración sin comprobante');
    if (!detail) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/cuotas/${quotaId}/manual-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detalle: detail })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo aprobar manualmente.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aprobar manualmente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button className="btn btn-secondary w-full sm:w-fit" disabled={loading} onClick={handleClick} type="button">
        {loading ? 'Procesando...' : 'Aprobación manual'}
      </button>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
