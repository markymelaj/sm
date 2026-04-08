import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getSupabaseUrl } from '@/lib/supabase/env';

export async function GET() {
  const admin = createAdminClient();
  const url = getSupabaseUrl();

  const adminEmail = 'admin@clientes.portal.local';
  const auditorEmail = 'rtenorio@clientes.portal.local';

  const { data: authAdmin, error: authAdminError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200
  });

  const foundAdmin = authAdmin?.users.find((u) => u.email === adminEmail) ?? null;
  const foundAuditor = authAdmin?.users.find((u) => u.email === auditorEmail) ?? null;

  const adminProfileQuery = foundAdmin
    ? await admin
        .from('perfiles')
        .select('id, identificador, rol, activo, requiere_cambio_pass')
        .eq('id', foundAdmin.id)
        .maybeSingle()
    : null;

  const auditorProfileQuery = foundAuditor
    ? await admin
        .from('perfiles')
        .select('id, identificador, rol, activo, requiere_cambio_pass')
        .eq('id', foundAuditor.id)
        .maybeSingle()
    : null;

  return NextResponse.json({
    projectUrl: url,
    authListUsersError: authAdminError?.message ?? null,
    adminAuthUser: foundAdmin
      ? { id: foundAdmin.id, email: foundAdmin.email }
      : null,
    auditorAuthUser: foundAuditor
      ? { id: foundAuditor.id, email: foundAuditor.email }
      : null,
    adminProfileError: adminProfileQuery?.error?.message ?? null,
    adminProfile: adminProfileQuery?.data ?? null,
    auditorProfileError: auditorProfileQuery?.error?.message ?? null,
    auditorProfile: auditorProfileQuery?.data ?? null
  });
}
