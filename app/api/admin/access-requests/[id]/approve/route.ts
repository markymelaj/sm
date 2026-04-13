import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { generateTemporaryPassword } from '@/lib/passwords';
import { makeTechnicalEmail } from '@/lib/rut';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    const { id } = await params;
    const admin: any = createAdminClient();
    const { data: accessRequest, error: requestError } = await admin
      .from('solicitudes_acceso')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (requestError) throw requestError;
    if (!accessRequest) {
      return NextResponse.json({ error: 'No se encontró la solicitud.' }, { status: 404 });
    }

    if (accessRequest.estado !== 'pendiente') {
      return NextResponse.json({ error: 'La solicitud ya fue resuelta.' }, { status: 400 });
    }

    const identificador = accessRequest.rut;
    const passwordTemporal = generateTemporaryPassword('CL');
    const emailTecnico = makeTechnicalEmail(identificador);
    let userId = accessRequest.perfil_id ?? null;

    if (!userId) {
      const { data: existingProfile } = await admin
        .from('perfiles')
        .select('id')
        .eq('rol', 'cliente')
        .eq('rut', identificador)
        .maybeSingle();
      userId = existingProfile?.id ?? null;
    }

    if (userId) {
      const { error: updateUserError } = await admin.auth.admin.updateUserById(userId, {
        email: emailTecnico,
        password: passwordTemporal,
        email_confirm: true,
        user_metadata: {
          identificador,
          rut: identificador,
          nombre_completo: accessRequest.nombre_completo,
          parcela: accessRequest.parcela,
          email: accessRequest.email,
          rol: 'cliente',
          requiere_cambio_pass: true,
          activo: true
        }
      });
      if (updateUserError) throw updateUserError;

      const { error: profileError } = await admin
        .from('perfiles')
        .update({
          identificador,
          rut: identificador,
          nombre_completo: accessRequest.nombre_completo,
          email: accessRequest.email,
          parcela: accessRequest.parcela,
          activo: true,
          requiere_cambio_pass: true
        })
        .eq('id', userId);
      if (profileError) throw profileError;
    } else {
      const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
        email: emailTecnico,
        password: passwordTemporal,
        email_confirm: true,
        user_metadata: {
          identificador,
          rut: identificador,
          nombre_completo: accessRequest.nombre_completo,
          parcela: accessRequest.parcela,
          email: accessRequest.email,
          rol: 'cliente',
          requiere_cambio_pass: true,
          activo: true
        }
      });
      if (createError) throw createError;
      userId = createdUser.user?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'No se pudo generar el acceso del cliente.' }, { status: 500 });
    }

    const { error: fichaError } = await admin.from('fichas_cliente').upsert(
      {
        perfil_id: userId,
        titular_parcela: accessRequest.nombre_completo,
        rut_titular: identificador,
        parcela: accessRequest.parcela,
        numero_parcela: accessRequest.parcela,
        telefono: accessRequest.telefono,
        email_contacto: accessRequest.email
      },
      { onConflict: 'perfil_id' }
    );
    if (fichaError) throw fichaError;

    const { data: fichaCreada, error: fichaLookupError } = await admin
      .from('fichas_cliente')
      .select('id')
      .eq('perfil_id', userId)
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
            observacion: 'Solicitud de acceso aprobada',
            updated_by: profile.id
          },
          { onConflict: 'ficha_id,estado_tipo_id' }
        );
        if (estadoError) throw estadoError;
      }
    }

    const { error: requestUpdateError } = await admin
      .from('solicitudes_acceso')
      .update({
        estado: 'aprobada',
        perfil_id: userId,
        processed_by: profile.id,
        processed_at: new Date().toISOString(),
        observacion_admin: null
      })
      .eq('id', id);
    if (requestUpdateError) throw requestUpdateError;

    await admin.from('audit_log').insert({
      actor_id: profile.id,
      entidad: 'solicitudes_acceso',
      entidad_id: id,
      accion: 'aprobar_solicitud_acceso',
      detalle: { perfil_id: userId, rut: identificador, parcela: accessRequest.parcela }
    });

    return NextResponse.json({
      ok: true,
      userId,
      credentials: {
        identificador,
        passwordTemporal,
        emailTecnico
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo aprobar la solicitud.' }, { status: 500 });
  }
}
