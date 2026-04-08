import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { makeTechnicalEmail, normalizeIdentifier } from '@/lib/rut';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const supabase: any = await createClient();
    const admin = createAdminClient() as any;

    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', id)
      .single();

    if (currentProfileError || !currentProfile) {
      return NextResponse.json({ error: 'No se encontró el perfil a editar.' }, { status: 404 });
    }

    const payload: Record<string, unknown> = {};
    const auditDetail: Record<string, unknown> = {};
    let nextRut: string | null = null;

    if ('nombre_completo' in body) {
      const nombreCompleto = String(body.nombre_completo || '').trim();
      payload.nombre_completo = nombreCompleto;
      auditDetail.nombre_completo = nombreCompleto;
    }

    if ('email' in body) {
      const email = String(body.email || '').trim() || null;
      payload.email = email;
      auditDetail.email = email;
    }

    if ('activo' in body) {
      const activo = Boolean(body.activo);
      payload.activo = activo;
      auditDetail.activo = activo;
    }

    if ('rut' in body && currentProfile.rol === 'cliente') {
      nextRut = normalizeIdentifier(String(body.rut || ''));
      if (!nextRut) {
        return NextResponse.json({ error: 'Debes indicar un RUT válido para el acceso del cliente.' }, { status: 400 });
      }
      payload.rut = nextRut;
      payload.identificador = nextRut;
      auditDetail.rut = nextRut;
      auditDetail.identificador = nextRut;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No hay cambios para guardar.' }, { status: 400 });
    }

    if (nextRut && nextRut !== currentProfile.identificador) {
      const { error: authError } = await admin.auth.admin.updateUserById(id, {
        email: makeTechnicalEmail(nextRut),
        email_confirm: true,
        user_metadata: {
          identificador: nextRut,
          rut: nextRut,
          nombre_completo: String(payload.nombre_completo ?? currentProfile.nombre_completo),
          parcela: currentProfile.parcela,
          email: payload.email ?? currentProfile.email,
          rol: currentProfile.rol,
          requiere_cambio_pass: currentProfile.requiere_cambio_pass,
          activo: 'activo' in payload ? Boolean(payload.activo) : currentProfile.activo
        }
      });

      if (authError) {
        return NextResponse.json({ error: authError.message || 'No se pudo actualizar el acceso del usuario en Auth.' }, { status: 400 });
      }
    }

    const { error } = await supabase.from('perfiles').update(payload).eq('id', id);
    if (error) throw error;

    if (nextRut && currentProfile.rol === 'cliente') {
      const { error: fichaError } = await supabase
        .from('fichas_cliente')
        .update({ rut_titular: nextRut })
        .eq('perfil_id', id);

      if (fichaError) throw fichaError;
    }

    await supabase.from('audit_log').insert({
      actor_id: profile.id,
      entidad: 'perfiles',
      entidad_id: id,
      accion: nextRut && nextRut !== currentProfile.identificador ? 'update_perfil_y_acceso' : 'update_perfil',
      detalle: auditDetail
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo actualizar el perfil.' }, { status: 500 });
  }
}
