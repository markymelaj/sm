export const dynamic = 'force-dynamic';

import { Suspense } from 'react';

import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="card w-full max-w-md p-7 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-300">Portal Santa Magdalena</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Acceso al sistema</h1>
        <p className="muted mt-3 text-sm">
          Clientes ingresan con su RUT. El equipo interno puede usar su usuario asignado.
        </p>
        <div className="mt-6">
          <Suspense fallback={<div className="muted text-sm">Cargando acceso...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
