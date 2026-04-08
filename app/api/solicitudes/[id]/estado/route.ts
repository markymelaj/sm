import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || !['admin', 'auditor'].includes(profile.rol)) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const supabase: any = await createClient();
    const payload = {
      estado: body.estado,
      motivo_rechazo: body.estado === 'rechazada' ? String(body.motivo_rechazo || '').trim() || null : null,
      revisada_por: profile.id,
      fecha_revision: new Date().toISOString()
    };
    const { error } = await supabase.from('solicitudes').update(payload).eq('id', id);
    if (error) throw error;
    await supabase.from('audit_log').insert({ actor_id: profile.id, entidad: 'solicitudes', entidad_id: id, accion: 'cambiar_estado_solicitud', detalle: payload });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo actualizar la solicitud.' }, { status: 500 });
  }
}
