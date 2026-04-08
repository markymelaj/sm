export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

import { getSessionProfile } from '@/lib/auth';

export default async function HomePage() {
  const { user, profile } = await getSessionProfile();

  if (!user || !profile) {
    redirect('/login');
  }

  if (!profile.activo) {
    redirect('/login?inactive=1');
  }

  if (profile.requiere_cambio_pass) {
    redirect('/cambiar-clave');
  }

  if (profile.rol === 'admin') {
    redirect('/admin');
  }

  if (profile.rol === 'auditor') {
    redirect('/auditor');
  }

  redirect('/dashboard');
}
