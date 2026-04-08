import { redirect } from 'next/navigation';

import { ChangePasswordForm } from '@/components/change-password-form';
import { getSessionProfile } from '@/lib/auth';

export default async function CambiarClavePage() {
  const { user, profile } = await getSessionProfile();

  if (!user || !profile) redirect('/login');
  if (!profile.requiere_cambio_pass) redirect('/');

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="card w-full max-w-md p-7 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-300">Primer ingreso</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Actualiza tu contraseña</h1>
        <p className="muted mt-3 text-sm">Este paso es obligatorio antes de seguir usando el portal.</p>
        <div className="mt-6">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
