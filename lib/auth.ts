import { redirect } from 'next/navigation';

import type { AppRole } from '@/lib/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type SessionProfile = any;

export async function getSessionProfile() {
  const supabase: any = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, user: null, profile: null as SessionProfile | null };
  }

  const admin = createAdminClient();
  const { data: profileData } = await admin
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const profile: SessionProfile | null = profileData ?? null;
  return { supabase, user, profile };
}

export async function requireSession() {
  const session = await getSessionProfile();
  if (!session.user || !session.profile) redirect('/login');

  if (!session.profile.activo) {
    await session.supabase.auth.signOut();
    redirect('/login?inactive=1');
  }

  return session as {
    supabase: any;
    user: NonNullable<Awaited<ReturnType<typeof getSessionProfile>>['user']>;
    profile: SessionProfile;
  };
}

export async function requireResolvedSession() {
  const session = await requireSession();
  if (session.profile.requiere_cambio_pass) redirect('/cambiar-clave');
  return session;
}

export async function requireRole(roles: AppRole[]) {
  const session = await requireResolvedSession();
  if (!roles.includes(session.profile.rol)) {
    if (session.profile.rol === 'admin') redirect('/admin');
    if (session.profile.rol === 'auditor') redirect('/auditor');
    redirect('/dashboard');
  }
  return session;
}
