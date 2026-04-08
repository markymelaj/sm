"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ResetPasswordButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleReset() {
    const confirmed = window.confirm('Se generará una nueva contraseña temporal. ¿Continuar?');
    if (!confirmed) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo reiniciar la contraseña.');
      setMessage(`Nueva contraseña temporal: ${payload.passwordTemporal}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reiniciar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button className="btn btn-secondary w-full sm:w-fit" disabled={loading} onClick={handleReset} type="button">
        {loading ? 'Reiniciando...' : 'Reiniciar contraseña'}
      </button>
      {message ? <p className="break-words text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="break-words text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
