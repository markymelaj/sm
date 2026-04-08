"use client";

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import type { Database } from '@/lib/types';

type Perfil = Database['public']['Tables']['perfiles']['Row'];

export function EditClientForm({ profile }: { profile: Perfil }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(profile.nombre_completo);
  const [email, setEmail] = useState(profile.email ?? '');
  const [activo, setActivo] = useState(profile.activo);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function updateClient(nextActivo = activo) {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`/api/admin/clientes/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_completo: nombre, email, activo: nextActivo })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo actualizar el acceso.');
      setActivo(nextActivo);
      setMessage(nextActivo ? 'Acceso actualizado.' : 'Cliente desactivado. El historial se conserva y ya no podrá ingresar.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el acceso.');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateClient(activo);
  }

  return (
    <form className="card grid gap-4 p-5" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Acceso</p>
        <h3 className="mt-2 text-xl font-bold text-white">Datos base del usuario</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="label">Identificador</label>
          <input className="input" disabled value={profile.identificador} />
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
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Guardando...' : 'Guardar acceso'}</button>
        {profile.rol === 'cliente' ? (
          <button
            className="btn btn-danger w-full sm:w-fit"
            disabled={loading || !activo}
            onClick={() => updateClient(false)}
            type="button"
          >
            Desactivar cliente
          </button>
        ) : null}
      </div>
    </form>
  );
}
