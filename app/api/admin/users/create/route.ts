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
    const rol = body.rol === 'auditor' ? 'auditor' : 'cliente';
    const identificador = normalizeIdentifier(body.identificador || body.rut || '');
    const parcela = String(body.parcela || '').trim() || null;
    const numeroRolParcela = String(body.numero_rol_parcela || '').trim() || null;
    const email = String(body.email || '').trim() || null;
    const nombre =
      String(body.nombre_completo || '').trim() ||
      (rol === 'cliente' ? `Cliente ${identificador}` : `Usuario ${identificador}`);

    if (!identificador) {
      return NextResponse.json({ error: 'Debes indicar el identificador de acceso.' }, { status: 400 });
    }

    if (rol === 'cliente' && !parcela) {
      return NextResponse.json({ error: 'Debes indicar la parcela del cliente.' }, { status: 400 });
    }

    const passwordTemporal = generateTemporaryPassword(rol === 'cliente' ? 'CL' : 'AU');
    const emailTecnico = makeTechnicalEmail(identificador);
    const admin: any = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email: emailTecnico,
      password: passwordTemporal,
      email_confirm: true,
      user_metadata: {
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

    if (rol === 'cliente' && data.user?.id) {
      const { error: fichaError } = await admin
        .from('fichas_cliente')
        .upsert(
          {
            perfil_id: data.user.id,
            titular_parcela: nombre,
            rut_titular: identificador,
            parcela,
            numero_parcela: parcela,
            numero_rol_parcela: numeroRolParcela,
            email_contacto: email
          },
          { onConflict: 'perfil_id' }
        );

      if (fichaError) throw fichaError;

      const { data: fichaCreada, error: fichaLookupError } = await admin
        .from('fichas_cliente')
        .select('id')
        .eq('perfil_id', data.user.id)
        .maybeSingle();
      if (fichaLookupError) throw fichaLookupError;

      if (fichaCreada?.id) {
        const { data: tipoInscripcion, error: tipoError } = await admin
          .from('ficha_estado_tipos')
          .select('id')
          .eq('codigo', 'inscripcion')
          .maybeSingle();
        if (tipoError) throw tipoError;
        if (tipoInscripcion?.id) {
          const { error: estadoError } = await admin.from('ficha_estado_valores').upsert(
            {
              ficha_id: fichaCreada.id,
              estado_tipo_id: tipoInscripcion.id,
              valor_bool: true,
              observacion: 'Alta inicial del sistema',
              updated_by: profile.id
            },
            { onConflict: 'ficha_id,estado_tipo_id' }
          );
          if (estadoError) throw estadoError;
        }
      }
    }

    await admin.from('audit_log').insert({
      actor_id: profile.id,
      entidad: 'perfiles',
      entidad_id: data.user?.id ?? null,
      accion: 'crear_usuario',
      detalle: { identificador, rol, parcela, numero_rol_parcela: numeroRolParcela }
    });

    return NextResponse.json({
      ok: true,
      userId: data.user?.id ?? null,
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
