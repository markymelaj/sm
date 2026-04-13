"use client";

import { useState, useTransition } from 'react';

export function EditMyFichaForm({ fichaId, initialNumeroRol }: { fichaId: string; initialNumeroRol: string }) {
  const [numeroRol, setNumeroRol] = useState(initialNumeroRol);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage('');
    startTransition(async () => {
      try {
        const response = await fetch('/api/dashboard/ficha', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ficha_id: fichaId, numero_rol_parcela: numeroRol })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudo guardar el número de rol.');
        setMessage('Número de rol actualizado.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'No se pudo guardar el número de rol.');
      }
    });
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-white">Actualizar número de rol</p>
          <p className="muted mt-1 text-xs">Si ya cuentas con tu número de rol, puedes completarlo o corregirlo aquí.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label className="label">Número de rol</label>
          <input className="input" onChange={(e) => setNumeroRol(e.target.value)} value={numeroRol} />
        </div>
        <button className="btn btn-primary" disabled={isPending} onClick={save} type="button">
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
      {message ? <p className="mt-3 text-xs text-sky-300">{message}</p> : null}
    </div>
  );
}
