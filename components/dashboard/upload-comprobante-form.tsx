"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function UploadComprobanteForm({ cuotaId }: { cuotaId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError('Selecciona un archivo.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/cuotas/${cuotaId}/upload`, { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo subir el comprobante.');
      setFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el comprobante.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <input accept="application/pdf,image/jpeg,image/png" className="input" onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" />
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <button className="btn btn-secondary w-full sm:w-fit" disabled={loading || !file} type="submit">{loading ? 'Subiendo...' : 'Subir comprobante'}</button>
    </form>
  );
}
