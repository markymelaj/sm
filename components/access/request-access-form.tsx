"use client";

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

export function RequestAccessForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [parcel, setParcel] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_completo: name,
          rut,
          parcela: parcel,
          telefono: phone,
          email
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo enviar la solicitud.');

      setSuccess('Tu solicitud fue enviada correctamente. Revisaremos si estás inscrito y te responderemos para activar tu acceso.');
      setName('');
      setRut('');
      setParcel('');
      setPhone('');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card grid gap-4 p-5 sm:p-6" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Solicitud de acceso</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Pide tu acceso al portal</h1>
        <p className="muted mt-3 text-sm">
          Ingresa estos datos mínimos del titular del contrato. Después, cuando tu acceso esté aprobado, podrás completar el resto de tu ficha dentro del portal.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="label" htmlFor="nombre">Nombre del titular</label>
          <input className="input" id="nombre" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre y apellido" required />
        </div>

        <div className="space-y-2">
          <label className="label" htmlFor="rut">RUT</label>
          <input className="input" id="rut" value={rut} onChange={(event) => setRut(event.target.value)} placeholder="Ejemplo: 12345678K" required />
          <p className="muted text-xs">Ingresa el RUT sin puntos ni guion.</p>
        </div>

        <div className="space-y-2">
          <label className="label" htmlFor="parcela">Parcela</label>
          <input className="input" id="parcela" value={parcel} onChange={(event) => setParcel(event.target.value)} placeholder="Ejemplo: Parcela 18" required />
        </div>

        <div className="space-y-2">
          <label className="label" htmlFor="telefono">Teléfono</label>
          <input className="input" id="telefono" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ejemplo: +56 9 1234 5678" required />
        </div>

        <div className="space-y-2">
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Opcional" />
        </div>
      </div>

      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button className="btn btn-primary w-full sm:w-fit" disabled={loading} type="submit">
          {loading ? 'Enviando...' : 'Enviar solicitud'}
        </button>
        <Link className="btn btn-secondary w-full sm:w-fit" href="/login">
          Volver al login
        </Link>
      </div>
    </form>
  );
}
