import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const supabase: any = await createClient();

    const payload: Record<string, unknown> = {};
    if ('concepto' in body) payload.concepto = String(body.concepto || '').trim();
    if ('monto_total' in body) payload.monto_total = Number(body.monto_total || 0);
    if ('fecha_vencimiento' in body) payload.fecha_vencimiento = body.fecha_vencimiento;
    if ('estado' in body && ['pendiente', 'en_revision', 'pagado', 'rechazado'].includes(body.estado)) {
      payload.estado = body.estado;
      if (body.estado !== 'rechazado') payload.motivo_rechazo = null;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No hay cambios para guardar.' }, { status: 400 });
    }

    const { error } = await supabase.from('cuotas').update(payload).eq('id', id);
    if (error) throw error;

    await supabase.from('audit_log').insert({
      actor_id: profile.id,
      entidad: 'cuotas',
      entidad_id: id,
      accion: 'update_cuota',
      detalle: payload
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo actualizar la cuota.' }, { status: 500 });
  }
}
