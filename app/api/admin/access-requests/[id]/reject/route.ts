import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const observacion = String(body.observacion_admin || '').trim() || null;
    const admin: any = createAdminClient();

    const { error } = await admin
      .from('solicitudes_acceso')
      .update({
        estado: 'rechazada',
        observacion_admin: observacion,
        processed_by: profile.id,
        processed_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('estado', 'pendiente');

    if (error) throw error;

    await admin.from('audit_log').insert({
      actor_id: profile.id,
      entidad: 'solicitudes_acceso',
      entidad_id: id,
      accion: 'rechazar_solicitud_acceso',
      detalle: { observacion_admin: observacion }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo rechazar la solicitud.' }, { status: 500 });
  }
}
