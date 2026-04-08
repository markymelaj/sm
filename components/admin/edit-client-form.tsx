"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import { formatIdentifier } from '@/lib/format';
import type { Database } from '@/lib/types';

type Perfil = Database['public']['Tables']['perfiles']['Row'];
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function EditClientForm({ profile }: { profile: Perfil }) {
  const router = useRouter();
  const [rut, setRut] = useState(profile.rut ?? profile.identificador);
  const [nombre, setNombre] = useState(profile.nombre_completo);
  const [email, setEmail] = useState(profile.email ?? '');
  const [activo, setActivo] = useState(profile.activo);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [autoStatus, setAutoStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRenderRef = useRef(true);
  const lastSavedRef = useRef(JSON.stringify({
    rut: profile.rut ?? profile.identificador,
    nombre: profile.nombre_completo,
    email: profile.email ?? ''
  }));

  const currentAccess = useMemo(() => formatIdentifier(profile.rut ?? profile.identificador), [profile.identificador, profile.rut]);
  const autoSnapshot = JSON.stringify({ rut, nombre, email });

  async function saveClient(options: { silent?: boolean; nextActivo?: boolean; includeActivo?: boolean } = {}) {
    const { silent = false, nextActivo = activo, includeActivo = false } = options;

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
      const body: Record<string, unknown> = {
        nombre_completo: nombre,
        email,
        ...(profile.rol === 'cliente' ? { rut } : {})
      };

      if (includeActivo) {
        body.activo = nextActivo;
      }

      const response = await fetch(`/api/admin/clientes/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo actualizar el acceso.');

      if (includeActivo) {
        setActivo(nextActivo);
      }

      const nextSnapshot = JSON.stringify({ rut, nombre, email });
      lastSavedRef.current = nextSnapshot;

      if (silent) {
        setAutoStatus('saved');
      } else if (!nextActivo) {
        setMessage('Cliente desactivado. El historial se conserva y ya no podrá ingresar.');
        router.refresh();
      } else if (profile.rol === 'cliente') {
        setMessage('Acceso actualizado. Si cambiaste el RUT, el ingreso del cliente quedó actualizado con ese nuevo dato.');
        router.refresh();
      } else {
        setMessage('Acceso actualizado.');
        router.refresh();
      }
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'No se pudo actualizar el acceso.';
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
    await saveClient({ includeActivo: true });
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
      void saveClient({ silent: true });
    }, 1000);

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
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Acceso</p>
        <h3 className="mt-2 text-xl font-bold text-white">Datos base del usuario</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="label">{profile.rol === 'cliente' ? 'RUT de acceso' : 'Usuario interno'}</label>
          <input
            className="input"
            disabled={profile.rol !== 'cliente'}
            value={profile.rol === 'cliente' ? rut : profile.identificador}
            onChange={(event) => setRut(event.target.value)}
          />
          {profile.rol === 'cliente' ? (
            <p className="muted text-xs">El cliente entra con este RUT. Si lo cambias, también se actualizará su acceso.</p>
          ) : (
            <p className="muted text-xs">Acceso actual: {currentAccess}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="label">Rol</label>
          <input className="input" disabled value={profile.rol} />
        </div>
        <div className="space-y-2">
          <label className="label">Nombre completo</label>
          <input className="input" value={nombre} onChange={(event) => setNombre(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="label">Email real</label>
          <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input checked={activo} onChange={(event) => setActivo(event.target.checked)} type="checkbox" />
        Acceso activo
      </label>
      <p className="muted text-xs">Desactivar el cliente bloquea su ingreso, pero conserva historial, pagos y trazabilidad.</p>
      {autoStatus !== 'idle' ? (
        <p className={`text-xs ${autoStatus === 'error' ? 'text-rose-300' : 'text-sky-300'}`}>
          {autoStatus === 'saving' ? 'Guardando automáticamente...' : autoStatus === 'saved' ? 'Guardado automático.' : 'No se pudo guardar automáticamente.'}
        </p>
      ) : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Guardando...' : 'Guardar acceso'}</button>
        {profile.rol === 'cliente' ? (
          <button
            className="btn btn-danger w-full sm:w-fit"
            disabled={loading || !activo}
            onClick={() => saveClient({ nextActivo: false, includeActivo: true })}
            type="button"
          >
            Desactivar cliente
          </button>
        ) : null}
      </div>
    </form>
  );
}
