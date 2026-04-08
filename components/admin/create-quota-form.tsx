"use client";

import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';

export function CreateQuotaForm({ profileId }: { profileId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [estado, setEstado] = useState<'pendiente' | 'pagado'>('pendiente');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.set('concepto', concepto);
      formData.set('monto_total', monto);
      formData.set('fecha_vencimiento', fecha);
      formData.set('estado', estado);
      if (file) {
        formData.set('file', file);
      }

      const response = await fetch(`/api/admin/clientes/${profileId}/cuotas`, {
        method: 'POST',
        body: formData
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo registrar el pago.');

      setConcepto('');
      setMonto('');
      setFecha('');
      setEstado('pendiente');
      setFile(null);
      if (fileRef.current) {
        fileRef.current.value = '';
      }
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
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Pagos</p>
        <h3 className="mt-2 text-xl font-bold text-white">Registrar pago o cuota</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2 md:col-span-4"><label className="label">Concepto</label><input className="input" value={concepto} onChange={(e) => setConcepto(e.target.value)} /></div>
        <div className="space-y-2"><label className="label">Monto</label><input className="input" inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value)} /></div>
        <div className="space-y-2"><label className="label">Fecha de pago</label><input className="input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
        <div className="space-y-2"><label className="label">Tipo</label><select className="select" value={estado} onChange={(e) => setEstado(e.target.value as 'pendiente' | 'pagado')}><option value="pendiente">Próxima cuota</option><option value="pagado">Pago ya realizado</option></select></div>
        <div className="space-y-2 md:col-span-4">
          <label className="label">Comprobante opcional</label>
          <input
            ref={fileRef}
            accept="application/pdf,image/png,image/jpeg"
            className="input"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
          <p className="muted text-xs">Puedes adjuntarlo si el cliente ya te lo envió. Si no lo tienes, el pago se registra igual.</p>
        </div>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Guardando...' : 'Registrar'}</button>
    </form>
  );
}
