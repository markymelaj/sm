import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { generateTemporaryPassword } from '@/lib/passwords';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    const { id } = await Promise.resolve(params);
    const passwordTemporal = generateTemporaryPassword('Reset');
    const admin: any = createAdminClient();

    const { error } = await admin.auth.admin.updateUserById(id, { password: passwordTemporal });
    if (error) throw error;

    await admin.from('perfiles').update({ requiere_cambio_pass: true }).eq('id', id);
    await admin.from('audit_log').insert({ actor_id: profile.id, entidad: 'perfiles', entidad_id: id, accion: 'reset_password', detalle: { requiere_cambio_pass: true } });

    return NextResponse.json({ ok: true, passwordTemporal });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo reiniciar la contraseña.' }, { status: 500 });
  }
}
