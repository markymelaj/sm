"use client";

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import type { Database } from '@/lib/types';

type EstadoTipo = Database['public']['Tables']['ficha_estado_tipos']['Row'];
type EstadoValor = Database['public']['Tables']['ficha_estado_valores']['Row'];

export function EstadoValorEditor({
  profileId,
  fichaId,
  estadoTipo,
  valor
}: {
  profileId: string;
  fichaId: string;
  estadoTipo: EstadoTipo;
  valor: EstadoValor | undefined;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const initialText = valor?.valor_texto ?? '';
  const initialBool = valor?.valor_bool ?? false;
  const initialDate = valor?.valor_fecha ?? '';
  const [textValue, setTextValue] = useState(initialText);
  const [boolValue, setBoolValue] = useState(initialBool);
  const [dateValue, setDateValue] = useState(initialDate);
  const [note, setNote] = useState(valor?.observacion ?? '');
  const options = useMemo(() => Array.isArray(estadoTipo.opciones_json) ? estadoTipo.opciones_json as string[] : [], [estadoTipo.opciones_json]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/admin/clientes/${profileId}/estado-valores`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ficha_id: fichaId,
          estado_tipo_id: estadoTipo.id,
          valor_bool: estadoTipo.tipo_input === 'boolean' ? boolValue : null,
          valor_texto: estadoTipo.tipo_input === 'text' || estadoTipo.tipo_input === 'select' ? textValue : null,
          valor_fecha: estadoTipo.tipo_input === 'date' ? dateValue : null,
          observacion: note
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo guardar el estado.');
      setMessage('Guardado.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el estado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-3 rounded-2xl border border-white/8 bg-slate-900/50 p-4" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-bold text-white">{estadoTipo.etiqueta}</p>
        <p className="muted text-xs">Código: {estadoTipo.codigo}</p>
      </div>
      {estadoTipo.tipo_input === 'boolean' ? (
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input checked={boolValue} onChange={(event) => setBoolValue(event.target.checked)} type="checkbox" />
          Marcar como activo
        </label>
      ) : null}
      {estadoTipo.tipo_input === 'text' ? <input className="input" value={textValue} onChange={(event) => setTextValue(event.target.value)} /> : null}
      {estadoTipo.tipo_input === 'select' ? (
        <select className="select" value={textValue} onChange={(event) => setTextValue(event.target.value)}>
          <option value="">Seleccionar</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : null}
      {estadoTipo.tipo_input === 'date' ? <input className="input" type="date" value={dateValue} onChange={(event) => setDateValue(event.target.value)} /> : null}
      <input className="input" placeholder="Observación opcional" value={note} onChange={(event) => setNote(event.target.value)} />
      {message ? <p className="text-xs text-emerald-300">{message}</p> : null}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <button className="btn btn-secondary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Guardando...' : 'Guardar estado'}</button>
    </form>
  );
}
