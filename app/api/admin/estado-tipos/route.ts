import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { normalizeIdentifier } from '@/lib/rut';

export async function POST(request: Request) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    const body = await request.json();
    const supabase: any = await createClient();
    const payload = {
      codigo: normalizeIdentifier(String(body.codigo || '')).toLowerCase(),
      etiqueta: String(body.etiqueta || '').trim(),
      tipo_input: body.tipo_input,
      opciones_json: body.opciones_json ?? null,
      sort_order: Number(body.sort_order || 50),
      is_active: true
    };
    const { error } = await supabase.from('ficha_estado_tipos').insert(payload);
    if (error) throw error;
    await supabase.from('audit_log').insert({ actor_id: profile.id, entidad: 'ficha_estado_tipos', accion: 'crear_estado_tipo', detalle: payload });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo crear el estado.' }, { status: 500 });
  }
}
