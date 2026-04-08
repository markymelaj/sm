import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const supabase: any = await createClient();
    const payload = {
      ficha_id: body.ficha_id,
      estado_tipo_id: body.estado_tipo_id,
      valor_bool: body.valor_bool ?? null,
      valor_texto: body.valor_texto ?? null,
      valor_fecha: body.valor_fecha || null,
      observacion: body.observacion || null,
      updated_by: profile.id
    };

    const { error } = await supabase.from('ficha_estado_valores').upsert(payload, { onConflict: 'ficha_id,estado_tipo_id' });
    if (error) throw error;

    await supabase.from('audit_log').insert({ actor_id: profile.id, entidad: 'ficha_estado_valores', entidad_id: id, accion: 'upsert_estado', detalle: payload });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo guardar el estado.' }, { status: 500 });
  }
}
