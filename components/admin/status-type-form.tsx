"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function StatusTypeForm() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [tipoInput, setTipoInput] = useState<'boolean' | 'text' | 'select' | 'date'>('boolean');
  const [opciones, setOpciones] = useState('');
  const [order, setOrder] = useState('50');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/estado-tipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          etiqueta,
          tipo_input: tipoInput,
          opciones_json: tipoInput === 'select' ? opciones.split(',').map((item) => item.trim()).filter(Boolean) : null,
          sort_order: Number(order)
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo crear el estado.');
      setCodigo('');
      setEtiqueta('');
      setOpciones('');
      setOrder('50');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el estado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card grid gap-4 p-5" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Configuración</p>
        <h3 className="mt-2 text-xl font-bold text-white">Crear estado editable</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><label className="label">Código</label><input className="input" value={codigo} onChange={(e) => setCodigo(e.target.value)} /></div>
        <div className="space-y-2"><label className="label">Etiqueta</label><input className="input" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} /></div>
        <div className="space-y-2"><label className="label">Tipo</label><select className="select" value={tipoInput} onChange={(e) => setTipoInput(e.target.value as 'boolean' | 'text' | 'select' | 'date')}><option value="boolean">Booleano</option><option value="text">Texto</option><option value="select">Lista</option><option value="date">Fecha</option></select></div>
        <div className="space-y-2"><label className="label">Orden</label><input className="input" inputMode="numeric" value={order} onChange={(e) => setOrder(e.target.value)} /></div>
        {tipoInput === 'select' ? <div className="space-y-2 md:col-span-2"><label className="label">Opciones separadas por coma</label><input className="input" value={opciones} onChange={(e) => setOpciones(e.target.value)} /></div> : null}
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Guardando...' : 'Guardar estado'}</button>
    </form>
  );
}
