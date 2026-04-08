"use client";

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';

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
  const [numeroRol, setNumeroRol] = useState('');
  const [email, setEmail] = useState('');

  const identifierLabel = useMemo(
    () => (role === 'cliente' ? 'RUT' : 'Usuario interno'),
    [role]
  );

  const identifierPlaceholder = role === 'cliente' ? 'Ejemplo: 12345678K' : 'Ejemplo: rtenorio';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
          numero_rol_parcela: numeroRol,
          email
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo crear el usuario.');

      const ingreso = role === 'cliente' ? `RUT: ${payload.credentials.identificador}` : `usuario: ${payload.credentials.identificador}`;
      setMessage(
        `Usuario creado. Ingresa con ${ingreso} · clave temporal: ${payload.credentials.passwordTemporal}. En el primer ingreso deberá cambiarla.`
      );
      setIdentifier('');
      setName('');
      setParcel('');
      setNumeroRol('');
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
          <label className="label">{identifierLabel}</label>
          <input
            className="input"
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={identifierPlaceholder}
          />
          {role === 'cliente' ? <p className="muted text-xs">Ingresa el RUT sin puntos ni guion.</p> : null}
        </div>
        <div className="space-y-2">
          <label className="label">Nombre completo</label>
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Opcional por ahora" />
        </div>
        <div className="space-y-2">
          <label className="label">Parcela</label>
          <input
            className="input"
            required={role === 'cliente'}
            value={parcel}
            onChange={(event) => setParcel(event.target.value)}
            placeholder="Ejemplo: Parcela 18"
          />
        </div>
        <div className="space-y-2">
          <label className="label">Número de rol</label>
          <input
            className="input"
            value={numeroRol}
            onChange={(event) => setNumeroRol(event.target.value)}
            placeholder="Opcional"
          />
        </div>
        <div className="space-y-2">
          <label className="label">Email real</label>
          <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Opcional" />
        </div>
      </div>
      {message ? <p className="break-words text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="break-words text-sm text-rose-300">{error}</p> : null}
      <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Creando...' : 'Crear usuario'}</button>
    </form>
  );
}
