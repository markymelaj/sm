"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SimulatePaymentButton({ cuotaId }: { cuotaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/cuotas/${cuotaId}/simular-pago`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo registrar el pago simulado.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el pago simulado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button className="btn btn-ghost w-full sm:w-fit" disabled={loading} onClick={handleClick} type="button">
        {loading ? 'Procesando...' : 'Pagar online (simulado)'}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
