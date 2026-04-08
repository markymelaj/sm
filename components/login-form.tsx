"use client";

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function getErrorMessage(code: string | null) {
  switch (code) {
    case 'invalid':
      return 'RUT o contraseña incorrectos.';
    case 'missing':
      return 'Debes ingresar tu RUT y contraseña.';
    case 'config':
      return 'Falta configuración del sistema.';
    case 'session':
      return 'Se inició sesión, pero no se pudo confirmar el usuario.';
    case 'profile':
      return 'Se inició sesión, pero no se pudo cargar tu perfil.';
    case 'inactive':
      return 'Tu acceso se encuentra desactivado.';
    default:
      return '';
  }
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const errorMessage = useMemo(() => {
    if (searchParams.get('inactive')) return 'Tu acceso se encuentra desactivado.';
    return getErrorMessage(searchParams.get('error'));
  }, [searchParams]);

  return (
    <form className="space-y-4" action="/api/auth/login" method="post">
      <div className="space-y-2">
        <label className="label" htmlFor="identifier">RUT</label>
        <input
          autoComplete="username"
          className="input"
          id="identifier"
          name="identifier"
          placeholder="Ejemplo: 12345678K"
          required
        />
        <p className="muted text-xs">Ingresa tu RUT sin puntos ni guion.</p>
      </div>

      <div className="space-y-2">
        <label className="label" htmlFor="password">Contraseña</label>
        <div className="relative">
          <input
            autoComplete="current-password"
            className="input pr-12"
            id="password"
            name="password"
            placeholder="••••••••"
            type={showPassword ? 'text' : 'password'}
            required
          />
          <button
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-3 my-auto text-sm font-semibold text-slate-300"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? 'Ocultar' : 'Ver'}
          </button>
        </div>
        <p className="muted text-xs">En tu primer ingreso deberás cambiar tu contraseña.</p>
      </div>

      {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}

      <button className="btn btn-primary w-full" type="submit">
        Ingresar
      </button>
    </form>
  );
}
