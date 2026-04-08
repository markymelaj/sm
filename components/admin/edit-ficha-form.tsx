"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import type { Database } from '@/lib/types';

type Ficha = Database['public']['Tables']['fichas_cliente']['Row'] | null;
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function EditFichaForm({ ficha, profileId }: { ficha: Ficha; profileId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    titular_parcela: ficha?.titular_parcela ?? '',
    rut_titular: ficha?.rut_titular ?? '',
    numero_rol_parcela: ficha?.numero_rol_parcela ?? '',
    parcela: ficha?.parcela ?? '',
    telefono: ficha?.telefono ?? '',
    email_contacto: ficha?.email_contacto ?? '',
    direccion_referencia: ficha?.direccion_referencia ?? '',
    observaciones: ficha?.observaciones ?? ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [autoStatus, setAutoStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRenderRef = useRef(true);
  const lastSavedRef = useRef(JSON.stringify({
    titular_parcela: ficha?.titular_parcela ?? '',
    rut_titular: ficha?.rut_titular ?? '',
    numero_rol_parcela: ficha?.numero_rol_parcela ?? '',
    parcela: ficha?.parcela ?? '',
    telefono: ficha?.telefono ?? '',
    email_contacto: ficha?.email_contacto ?? '',
    direccion_referencia: ficha?.direccion_referencia ?? '',
    observaciones: ficha?.observaciones ?? ''
  }));
  const autoSnapshot = JSON.stringify(form);

  async function saveFicha(options: { silent?: boolean } = {}) {
    const { silent = false } = options;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (silent) {
      setAutoStatus('saving');
      setError('');
    } else {
      setLoading(true);
      setMessage('');
      setError('');
    }

    try {
      const response = await fetch(`/api/admin/clientes/${profileId}/ficha`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo actualizar la ficha.');

      lastSavedRef.current = JSON.stringify(form);

      if (silent) {
        setAutoStatus('saved');
      } else {
        setMessage('Ficha actualizada.');
        router.refresh();
      }
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'No se pudo actualizar la ficha.';
      setError(nextError);
      if (silent) {
        setAutoStatus('error');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveFicha();
  }

  function patch(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    if (autoSnapshot === lastSavedRef.current) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      void saveFicha({ silent: true });
    }, 1100);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [autoSnapshot]);

  useEffect(() => {
    if (autoStatus !== 'saved') return;
    const timeout = setTimeout(() => setAutoStatus('idle'), 1800);
    return () => clearTimeout(timeout);
  }, [autoStatus]);

  return (
    <form className="card grid gap-4 p-5" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Ficha de cliente</p>
        <h3 className="mt-2 text-xl font-bold text-white">Datos administrativos de la parcela</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><label className="label">Titular parcela</label><input className="input" value={form.titular_parcela} onChange={(e) => patch('titular_parcela', e.target.value)} /></div>
        <div className="space-y-2"><label className="label">RUT titular</label><input className="input" value={form.rut_titular} onChange={(e) => patch('rut_titular', e.target.value)} /></div>
        <div className="space-y-2"><label className="label">Número de rol</label><input className="input" value={form.numero_rol_parcela} onChange={(e) => patch('numero_rol_parcela', e.target.value)} /></div>
        <div className="space-y-2"><label className="label">Parcela</label><input className="input" value={form.parcela} onChange={(e) => patch('parcela', e.target.value)} /></div>
        <div className="space-y-2"><label className="label">Teléfono</label><input className="input" value={form.telefono} onChange={(e) => patch('telefono', e.target.value)} /></div>
        <div className="space-y-2"><label className="label">Email contacto</label><input className="input" value={form.email_contacto} onChange={(e) => patch('email_contacto', e.target.value)} /></div>
        <div className="space-y-2 md:col-span-2"><label className="label">Dirección / referencia</label><input className="input" value={form.direccion_referencia} onChange={(e) => patch('direccion_referencia', e.target.value)} /></div>
        <div className="space-y-2 md:col-span-2"><label className="label">Observaciones visibles</label><textarea className="textarea" value={form.observaciones} onChange={(e) => patch('observaciones', e.target.value)} /></div>
      </div>
      {autoStatus !== 'idle' ? (
        <p className={`text-xs ${autoStatus === 'error' ? 'text-rose-300' : 'text-sky-300'}`}>
          {autoStatus === 'saving' ? 'Guardando automáticamente...' : autoStatus === 'saved' ? 'Guardado automático.' : 'No se pudo guardar automáticamente.'}
        </p>
      ) : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Guardando...' : 'Guardar ficha'}</button>
    </form>
  );
}
