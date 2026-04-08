"use client";

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';

import { CLIENT_PAYMENT_TYPE_OPTIONS } from '@/lib/constants';

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function RegisterPaymentForm() {
  const router = useRouter();
  const [monto, setMonto] = useState('');
  const [detalle, setDetalle] = useState('');
  const [tipo, setTipo] = useState<'cuota' | 'pie' | 'adelanto'>('cuota');
  const [fechaPago, setFechaPago] = useState(todayValue());
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedLabel = useMemo(
    () => CLIENT_PAYMENT_TYPE_OPTIONS.find((item) => item.value === tipo)?.label ?? 'Pago',
    [tipo]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!file) throw new Error('Debes adjuntar el comprobante del pago.');

      const formData = new FormData();
      formData.append('monto_total', monto);
      formData.append('detalle', detalle);
      formData.append('tipo_pago', tipo);
      formData.append('fecha_pago', fechaPago);
      formData.append('file', file);

      const response = await fetch('/api/pagos/registrar', {
        method: 'POST',
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo registrar el pago.');

      setMonto('');
      setDetalle('');
      setTipo('cuota');
      setFechaPago(todayValue());
      setFile(null);
      setSuccess(`Tu ${selectedLabel.toLowerCase()} quedó enviado para revisión.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el pago.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card grid gap-4 p-5" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Registrar pago</p>
        <h2 className="mt-2 text-xl font-bold text-white">Envía un pago realizado para revisión</h2>
        <p className="muted mt-2 text-sm">
          Si ya realizaste un pago y todavía no lo ves cargado, regístralo aquí con su comprobante.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="label">Monto</label>
          <input
            className="input"
            inputMode="numeric"
            placeholder="Ejemplo: 150000"
            required
            value={monto}
            onChange={(event) => setMonto(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="label">Fecha de pago</label>
          <input
            className="input"
            required
            type="date"
            value={fechaPago}
            onChange={(event) => setFechaPago(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="label">Corresponde a</label>
          <select className="select" value={tipo} onChange={(event) => setTipo(event.target.value as 'cuota' | 'pie' | 'adelanto')}>
            {CLIENT_PAYMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="label">Detalle</label>
          <textarea
            className="textarea"
            placeholder="Ejemplo: pago de abril, pie, adelanto, abono de saldo pendiente..."
            required
            value={detalle}
            onChange={(event) => setDetalle(event.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="label">Comprobante</label>
          <input
            accept="application/pdf,image/jpeg,image/png"
            className="input"
            required
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <p className="muted text-xs">Formato permitido: PDF, JPG o PNG. Máximo 3 MB.</p>
        </div>
      </div>

      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">
        {loading ? 'Enviando...' : 'Registrar pago'}
      </button>
    </form>
  );
}
