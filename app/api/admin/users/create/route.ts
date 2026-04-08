import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { generateTemporaryPassword } from '@/lib/passwords';
import { makeTechnicalEmail, normalizeIdentifier } from '@/lib/rut';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    const body = await request.json();
    const identificador = normalizeIdentifier(body.identificador || body.rut || '');
    const nombre = String(body.nombre_completo || '').trim();
    const rol = body.rol === 'auditor' ? 'auditor' : 'cliente';
    const parcela = String(body.parcela || '').trim() || null;
    const email = String(body.email || '').trim() || null;

    if (!identificador || !nombre) {
      return NextResponse.json({ error: 'Identificador y nombre son obligatorios.' }, { status: 400 });
    }

    const passwordTemporal = generateTemporaryPassword(rol === 'cliente' ? 'Cliente' : 'Auditor');
    const emailTecnico = makeTechnicalEmail(identificador);
    const admin: any = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email: emailTecnico,
      password: passwordTemporal,
      emailConfirm: true,
      userMetadata: {
        identificador,
        rut: rol === 'cliente' ? identificador : null,
        nombre_completo: nombre,
        parcela,
        email,
        rol,
        requiere_cambio_pass: true,
        activo: true
      }
    });

    if (error) throw error;

    await admin.from('audit_log').insert({
      actor_id: profile.id,
      entidad: 'perfiles',
      entidad_id: data.user?.id ?? null,
      accion: 'crear_usuario',
      detalle: { identificador, rol }
    });

    return NextResponse.json({
      ok: true,
      credentials: {
        identificador,
        passwordTemporal,
        emailTecnico
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo crear el usuario.' }, { status: 500 });
  }
}
