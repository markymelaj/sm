"use client";

import { useState } from 'react';

type PreviewRow = {
  parcela: string;
  rut: string;
  titular: string;
  rol: string;
  matchType: string;
  targetName: string | null;
  targetRut: string | null;
  systemStatus: string;
  safeToApply: boolean;
};

type PreviewResponse = {
  summary: {
    rows: number;
    matched: number;
    safe: number;
    conflicts: number;
    missing: number;
  };
  rows: PreviewRow[];
};

export function CsvImportTool() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handlePreview() {
    if (!file) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.set('file', file);
      const response = await fetch('/api/admin/importar-base/preview', { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo generar la vista previa.');
      setPreview(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la vista previa.');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!file) return;
    setApplying(true);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.set('file', file);
      const response = await fetch('/api/admin/importar-base/apply', { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo aplicar la importación.');
      setMessage(`Importación aplicada. Filas actualizadas: ${payload.updated}. Conflictos ignorados: ${payload.conflicts}.`);
      setPreview(payload.preview ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aplicar la importación.');
    } finally {
      setApplying(false);
    }
  }

  return (
    <section className="card p-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Importar base consolidada</p>
        <p className="muted mt-2 text-sm">Sube el CSV para completar RUT titular, titular, parcela y número de rol donde falten. Primero se muestra una vista previa y luego aplicas solo coincidencias seguras.</p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto]">
        <input className="input" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" />
        <button className="btn btn-secondary" disabled={!file || loading} onClick={handlePreview} type="button">{loading ? 'Analizando...' : 'Vista previa'}</button>
        <button className="btn btn-primary" disabled={!file || !preview || applying} onClick={handleApply} type="button">{applying ? 'Aplicando...' : 'Aplicar coincidencias seguras'}</button>
      </div>
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

      {preview ? (
        <div className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Filas</p><p className="mt-2 text-xl font-bold text-white">{preview.summary.rows}</p></div>
            <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Coincidencias</p><p className="mt-2 text-xl font-bold text-white">{preview.summary.matched}</p></div>
            <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Seguras</p><p className="mt-2 text-xl font-bold text-white">{preview.summary.safe}</p></div>
            <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Conflictos</p><p className="mt-2 text-xl font-bold text-white">{preview.summary.conflicts}</p></div>
            <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Sin match</p><p className="mt-2 text-xl font-bold text-white">{preview.summary.missing}</p></div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                  <th className="px-3 py-3">Parcela</th>
                  <th className="px-3 py-3">RUT</th>
                  <th className="px-3 py-3">Titular CSV</th>
                  <th className="px-3 py-3">ROL</th>
                  <th className="px-3 py-3">Coincidencia</th>
                  <th className="px-3 py-3">Cliente actual</th>
                  <th className="px-3 py-3">Estado sistema</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, index) => (
                  <tr className="border-b border-white/6 last:border-b-0" key={`${row.rut}-${index}`}>
                    <td className="px-3 py-4 text-slate-200">{row.parcela || '—'}</td>
                    <td className="px-3 py-4 text-slate-200">{row.rut || '—'}</td>
                    <td className="px-3 py-4 text-white">{row.titular || '—'}</td>
                    <td className="px-3 py-4 text-slate-200">{row.rol || '—'}</td>
                    <td className="px-3 py-4 text-slate-200">{row.matchType}</td>
                    <td className="px-3 py-4 text-slate-200">{row.targetName || '—'}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${row.safeToApply ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-200' : 'border-white/10 bg-slate-900/45 text-slate-300'}`}>{row.systemStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
