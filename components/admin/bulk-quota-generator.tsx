"use client";

import { useMemo, useState } from 'react';

type ClientItem = {
  id: string;
  nombre: string;
  rut: string;
  parcela: string;
  numeroRol: string;
  activo: boolean;
};

function addMonths(dateString: string, offset: number) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, (month - 1) + offset, day || 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function BulkQuotaGenerator({ clients }: { clients: ClientItem[] }) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [conceptoBase, setConceptoBase] = useState('Cuota');
  const [monto, setMonto] = useState('125000');
  const [fechaInicio, setFechaInicio] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return clients;
    return clients.filter((client) =>
      [client.nombre, client.rut, client.parcela, client.numeroRol].some((value) => String(value || '').toLowerCase().includes(normalized))
    );
  }, [clients, query]);

  const previews = useMemo(() => {
    const total = Math.max(Number(cantidad || 0), 0);
    if (!fechaInicio || !total) return [] as { concepto: string; fecha: string }[];
    return Array.from({ length: total }, (_, index) => ({
      concepto: `${conceptoBase} ${index + 1}`,
      fecha: addMonths(fechaInicio, index)
    }));
  }, [cantidad, conceptoBase, fechaInicio]);

  function toggle(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/cuotas/masivas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileIds: selectedIds,
          concepto_base: conceptoBase,
          monto_total: Number(monto),
          fecha_inicio: fechaInicio,
          cantidad: Number(cantidad)
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudieron generar las cuotas.');
      setMessage(`Se generaron ${payload.created} cuotas. Omitidas por posible duplicado: ${payload.skipped}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron generar las cuotas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-6">
      <div className="card grid gap-4 p-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Cuotas masivas</p>
          <p className="muted mt-2 text-sm">Selecciona uno o más clientes y genera varias cuotas futuras de una vez.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2"><label className="label">Buscar cliente</label><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, RUT, parcela o número de rol" /></div>
          <div className="space-y-2"><label className="label">Concepto base</label><input className="input" value={conceptoBase} onChange={(event) => setConceptoBase(event.target.value)} /></div>
          <div className="space-y-2"><label className="label">Monto por cuota</label><input className="input" inputMode="numeric" value={monto} onChange={(event) => setMonto(event.target.value)} /></div>
          <div className="space-y-2"><label className="label">Primera fecha</label><input className="input" type="date" value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value)} /></div>
          <div className="space-y-2"><label className="label">Cantidad de cuotas</label><input className="input" inputMode="numeric" value={cantidad} onChange={(event) => setCantidad(event.target.value)} /></div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-4">
          <p className="text-sm font-semibold text-white">Vista previa</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {previews.length > 0 ? previews.map((item) => (
              <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-3" key={item.concepto + item.fecha}>
                <p className="text-sm font-semibold text-white">{item.concepto}</p>
                <p className="muted mt-1 text-sm">Fecha: {item.fecha}</p>
              </div>
            )) : <p className="muted text-sm">Completa fecha y cantidad para ver las cuotas que se crearán.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Seleccionados: {selectedIds.length}</p>
            <button className="btn btn-secondary" onClick={() => setSelectedIds(filtered.map((client) => client.id))} type="button">Seleccionar visibles</button>
          </div>
          <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto">
            {filtered.map((client) => (
              <label className="flex items-start gap-3 rounded-2xl border border-white/8 bg-slate-900/45 p-3" key={client.id}>
                <input checked={selectedIds.includes(client.id)} className="mt-1 h-4 w-4" onChange={() => toggle(client.id)} type="checkbox" />
                <div>
                  <p className="font-semibold text-white">{client.nombre}</p>
                  <p className="muted text-sm">{client.rut} · Parcela {client.parcela || '—'} · Rol {client.numeroRol || '—'}{client.activo ? '' : ' · Sin alta sistema'}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button className="btn btn-primary w-full sm:w-fit" disabled={loading || selectedIds.length === 0 || !fechaInicio || !Number(cantidad) || !Number(monto)} onClick={handleSubmit} type="button">{loading ? 'Generando...' : 'Generar cuotas'}</button>
      </div>
    </section>
  );
}
