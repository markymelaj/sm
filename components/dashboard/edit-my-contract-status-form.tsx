"use client";

import { useMemo, useState, useTransition } from 'react';

type Tipo = {
  id: string;
  codigo: string;
  etiqueta: string;
  tipo_input: string;
};

type Valor = {
  estado_tipo_id: string;
  valor_bool: boolean | null;
};

const ALLOWED_CODES = new Set(['inscripcion', 'contrato_notaria', 'firmado_retiro']);

export function EditMyContractStatusForm({ fichaId, estadoTipos, estadoValues }: { fichaId: string; estadoTipos: Tipo[]; estadoValues: Valor[] }) {
  const contractTypes = useMemo(
    () => estadoTipos.filter((item) => item.tipo_input === 'boolean' && ALLOWED_CODES.has(item.codigo)),
    [estadoTipos]
  );
  const initialState = useMemo(() => Object.fromEntries(contractTypes.map((tipo) => [tipo.id, !!estadoValues.find((item) => item.estado_tipo_id === tipo.id)?.valor_bool])), [contractTypes, estadoValues]);
  const [form, setForm] = useState<Record<string, boolean>>(initialState);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function toggle(id: string, checked: boolean) {
    setForm((current) => ({ ...current, [id]: checked }));
  }

  function save() {
    setMessage('');
    startTransition(async () => {
      try {
        const response = await fetch('/api/dashboard/estado-valores', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ficha_id: fichaId,
            valores: contractTypes.map((tipo) => ({ estado_tipo_id: tipo.id, valor_bool: !!form[tipo.id] }))
          })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudo guardar el estado contractual.');
        setMessage('Estado contractual actualizado.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'No se pudo guardar el estado contractual.');
      }
    });
  }

  if (contractTypes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/8 bg-slate-900/45 p-4">
      <p className="text-sm font-bold text-white">Actualizar estado contractual</p>
      <p className="muted mt-1 text-xs">Puedes indicarnos el avance actual de tu documentación.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {contractTypes.map((tipo) => (
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/50 p-3 text-sm text-white" key={tipo.id}>
            <input checked={!!form[tipo.id]} className="h-4 w-4" onChange={(e) => toggle(tipo.id, e.target.checked)} type="checkbox" />
            <span>{tipo.etiqueta}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button className="btn btn-primary" disabled={isPending} onClick={save} type="button">
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
      {message ? <p className="mt-3 text-xs text-sky-300">{message}</p> : null}
    </div>
  );
}
