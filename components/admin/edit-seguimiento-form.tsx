"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function EditSeguimientoForm({ profileId, avanceParticular }: { profileId: string; avanceParticular: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(avanceParticular ?? '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [autoStatus, setAutoStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRenderRef = useRef(true);
  const lastSavedRef = useRef(avanceParticular ?? '');

  async function saveSeguimiento(options: { silent?: boolean } = {}) {
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
      const response = await fetch(`/api/admin/clientes/${profileId}/seguimiento`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avance_particular: value })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo guardar el seguimiento.');

      lastSavedRef.current = value;

      if (silent) {
        setAutoStatus('saved');
      } else {
        setMessage('Seguimiento actualizado.');
        router.refresh();
      }
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'No se pudo guardar el seguimiento.';
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSeguimiento();
  }

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    if (value === lastSavedRef.current) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      void saveSeguimiento({ silent: true });
    }, 1100);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  useEffect(() => {
    if (autoStatus !== 'saved') return;
    const timeout = setTimeout(() => setAutoStatus('idle'), 1800);
    return () => clearTimeout(timeout);
  }, [autoStatus]);

  return (
    <form className="card grid gap-4 p-5" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Seguimiento particular</p>
        <h3 className="mt-2 text-xl font-bold text-white">Texto visible para esta parcela</h3>
      </div>
      <textarea className="textarea" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Ejemplo: posteado revisado, acceso por portón derecho, visita técnica pendiente..." />
      {autoStatus !== 'idle' ? (
        <p className={`text-xs ${autoStatus === 'error' ? 'text-rose-300' : 'text-sky-300'}`}>
          {autoStatus === 'saving' ? 'Guardando automáticamente...' : autoStatus === 'saved' ? 'Guardado automático.' : 'No se pudo guardar automáticamente.'}
        </p>
      ) : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Guardando...' : 'Guardar seguimiento'}</button>
    </form>
  );
}
