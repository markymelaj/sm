"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ROLE_OPTIONS } from '@/lib/constants';

export function CreateUserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState<'cliente' | 'auditor'>('cliente');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [parcel, setParcel] = useState('');
  const [email, setEmail] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol: role,
          identificador: identifier,
          nombre_completo: name,
          parcela: parcel,
          email
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo crear el usuario.');

      setMessage(`Creado: ${payload.credentials.identificador.toLowerCase()} · clave: ${payload.credentials.passwordTemporal}`);
      setIdentifier('');
      setName('');
      setParcel('');
      setEmail('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card grid gap-4 p-5" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Alta de usuario</p>
        <h3 className="mt-2 text-xl font-bold text-white">Crear cliente o auditor</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="label">Rol</label>
          <select className="select" value={role} onChange={(event) => setRole(event.target.value as 'cliente' | 'auditor')}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="label">RUT o usuario interno</label>
          <input className="input" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={role === 'cliente' ? '12.345.678-5' : 'usuario interno'} />
        </div>
        <div className="space-y-2">
          <label className="label">Nombre completo</label>
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="label">Parcela o referencia</label>
          <input className="input" value={parcel} onChange={(event) => setParcel(event.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="label">Email real opcional</label>
          <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
      </div>
      {message ? <p className="break-words text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="break-words text-sm text-rose-300">{error}</p> : null}
      <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Creando...' : 'Crear usuario'}</button>
    </form>
  );
}
