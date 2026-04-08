"use client";

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

function getErrorMessage(code: string | null) {
  switch (code) {
    case 'invalid':
      return 'Credenciales inválidas.';
    case 'missing':
      return 'Debes ingresar tu RUT o usuario interno y la contraseña.';
    case 'config':
      return 'Falta configuración del sistema.';
    case 'session':
      return 'Se inició sesión, pero no se pudo confirmar el usuario.';
    case 'profile':
      return 'El usuario autenticó, pero no se pudo leer su perfil.';
    case 'inactive':
      return 'Tu acceso se encuentra desactivado.';
    default:
      return '';
  }
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const errorMessage = useMemo(() => {
    if (searchParams.get('inactive')) return 'Tu acceso se encuentra desactivado.';
    return getErrorMessage(searchParams.get('error'));
  }, [searchParams]);

  return (
    <form className="space-y-4" action="/api/auth/login" method="post">
      <div className="space-y-2">
        <label className="label" htmlFor="identifier">RUT o usuario interno</label>
        <input
          autoComplete="username"
          className="input"
          id="identifier"
          name="identifier"
          placeholder="Ejemplo: 12.345.678-5 o admin"
          required
        />
        <p className="muted text-xs">Si escribes tu RUT con puntos o guion, el sistema lo ajusta solo.</p>
      </div>

      <div className="space-y-2">
        <label className="label" htmlFor="password">Contraseña</label>
        <input
          autoComplete="current-password"
          className="input"
          id="password"
          name="password"
          placeholder="••••••••"
          type="password"
          required
        />
      </div>

      {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}

      <button className="btn btn-primary w-full" type="submit">
        Ingresar
      </button>
    </form>
  );
}
