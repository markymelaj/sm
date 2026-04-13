"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ActivateSystemButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleClick() {
    const confirmed = window.confirm('Se activará el acceso del cliente y se generará una contraseña temporal. ¿Continuar?');
    if (!confirmed) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${userId}/activate-system`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo activar el acceso.');
      setMessage(`Acceso activado. Usuario: ${payload.identificador} · clave temporal: ${payload.passwordTemporal}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo activar el acceso.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button className="btn btn-primary w-full sm:w-fit" disabled={loading} onClick={handleClick} type="button">
        {loading ? 'Activando...' : 'Alta sistema'}
      </button>
      {message ? <p className="break-words text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="break-words text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
