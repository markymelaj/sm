"use client";

import { useActionState } from 'react';

import { changePasswordAction } from '@/app/cambiar-clave/actions';

const initialState: { error?: string } = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="label" htmlFor="new-password">Nueva contraseña</label>
        <input className="input" id="new-password" name="password" type="password" />
      </div>
      <div className="space-y-2">
        <label className="label" htmlFor="confirm-password">Repetir contraseña</label>
        <input className="input" id="confirm-password" name="confirmPassword" type="password" />
      </div>
      {state?.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
      <button className="btn btn-primary w-full" disabled={pending} type="submit">
        {pending ? 'Guardando...' : 'Guardar nueva contraseña'}
      </button>
    </form>
  );
}
