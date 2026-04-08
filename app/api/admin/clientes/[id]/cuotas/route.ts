import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const supabase: any = await createClient();
    const payload = {
      perfil_id: id,
      concepto: String(body.concepto || '').trim(),
      monto_total: Number(body.monto_total || 0),
      fecha_vencimiento: body.fecha_vencimiento,
      estado: 'pendiente'
    };

    const { data, error } = await supabase.from('cuotas').insert(payload).select('id').single();
    if (error) throw error;
    await supabase.from('cuota_auditorias').insert({ cuota_id: data.id, actor_id: profile.id, accion: 'crear_cuota', detalle: payload.concepto });
    await supabase.from('audit_log').insert({ actor_id: profile.id, entidad: 'cuotas', entidad_id: data.id, accion: 'crear_cuota', detalle: payload });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo crear la cuota.' }, { status: 500 });
  }
}
