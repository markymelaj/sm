"use client";

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';

import { ROLE_OPTIONS } from '@/lib/constants';

function buildAccessMessage(portalUrl: string, role: 'cliente' | 'auditor', identifier: string, passwordTemporal: string) {
  const accessLabel = role === 'cliente' ? 'RUT de acceso' : 'Usuario de acceso';
  const loginLabel = role === 'cliente' ? 'tu RUT sin puntos ni guion' : 'tu usuario asignado';
  return [
    'Hola. Tu acceso al Portal Santa Magdalena ya está listo.',
    '',
    `Ingresa en: ${portalUrl}`,
    `${accessLabel}: ${identifier}`,
    `Debes escribir ${loginLabel}.`,
    `Clave temporal: ${passwordTemporal}`,
    '',
    'En tu primer ingreso el sistema te pedirá cambiar la contraseña.',
    'Dentro del portal podrás revisar tu información y tus pagos.',
    '',
    'Si tienes dudas, avísanos y te ayudamos.'
  ].join('\n');
}

export function CreateUserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [accessMessage, setAccessMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
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

  async function copyAccessMessage() {
    if (!accessMessage) return;
    try {
      await navigator.clipboard.writeText(accessMessage);
      setCopyMessage('Mensaje copiado.');
    } catch {
      setCopyMessage('No se pudo copiar automáticamente.');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setAccessMessage('');
    setCopyMessage('');

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

      const ingreso = role === 'cliente' ? `RUT de acceso: ${payload.credentials.identificador}` : `usuario: ${payload.credentials.identificador}`;
      const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';
      setMessage(
        `Usuario creado. Ingresa con ${ingreso} · clave temporal: ${payload.credentials.passwordTemporal}. En el primer ingreso deberá cambiarla.`
      );
      setAccessMessage(buildAccessMessage(portalUrl, role, payload.credentials.identificador, payload.credentials.passwordTemporal));
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
        <p className="muted mt-2 text-sm">El acceso y el RUT del cliente son el mismo dato. La parcela que ingreses aquí también quedará cargada en la ficha del cliente. El mensaje para copiar aparece solo después de crear el usuario.</p>
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
      {accessMessage ? (
        <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Mensaje listo para enviar al usuario</p>
            <button className="btn btn-secondary w-full sm:w-fit" onClick={copyAccessMessage} type="button">Copiar mensaje</button>
          </div>
          <textarea className="textarea mt-3 min-h-[210px]" readOnly value={accessMessage} />
          {copyMessage ? <p className="mt-2 text-xs text-sky-300">{copyMessage}</p> : null}
        </div>
      ) : null}
      {error ? <p className="break-words text-sm text-rose-300">{error}</p> : null}
      <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">{loading ? 'Creando...' : 'Crear usuario'}</button>
    </form>
  );
}
