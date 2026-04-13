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
    const admin: any = createAdminClient();
    const passwordTemporal = generateTemporaryPassword('CL');

    const { data: currentProfile, error: currentProfileError } = await admin
      .from('perfiles')
      .select('*')
      .eq('id', id)
      .single();

    if (currentProfileError || !currentProfile) {
      return NextResponse.json({ error: 'No se encontró el cliente.' }, { status: 404 });
    }

    const { error: authError } = await admin.auth.admin.updateUserById(id, {
      password: passwordTemporal,
      email_confirm: true,
      user_metadata: {
        identificador: currentProfile.identificador,
        rut: currentProfile.rut,
        nombre_completo: currentProfile.nombre_completo,
        parcela: currentProfile.parcela,
        email: currentProfile.email,
        rol: currentProfile.rol,
        requiere_cambio_pass: true,
        activo: true
      }
    });

    if (authError) throw authError;

    await admin.from('perfiles').update({ activo: true, requiere_cambio_pass: true }).eq('id', id);
    await admin.from('audit_log').insert({
      actor_id: profile.id,
      entidad: 'perfiles',
      entidad_id: id,
      accion: 'alta_sistema',
      detalle: { passwordTemporal, activo: true, requiere_cambio_pass: true }
    });

    return NextResponse.json({ ok: true, passwordTemporal, identificador: currentProfile.rut || currentProfile.identificador });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo activar el acceso.' }, { status: 500 });
  }
}
