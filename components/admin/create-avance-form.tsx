"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateAvanceForm() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/avances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descripcion, fecha })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo publicar el avance.');
      setTitulo('');
      setDescripcion('');
      setFecha('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar el avance.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card grid gap-4 p-5" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Muro general</p>
        <h3 className="mt-2 text-xl font-bold text-white">Publicar avance general</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2"><label className="label">Título</label><input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
        <div className="space-y-2 md:col-span-2"><label className="label">Descripción</label><textarea className="textarea" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></div>
        <div className="space-y-2"><label className="label">Fecha</label><input className="input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Publicando...' : 'Publicar avance'}</button>
    </form>
  );
}
