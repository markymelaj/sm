import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    const body = await request.json();
    const supabase: any = await createClient();
    const payload = {
      perfil_id: profile.id,
      creada_por: profile.id,
      tipo: body.tipo,
      asunto: String(body.asunto || '').trim(),
      detalle_inicial: String(body.detalle_inicial || '').trim(),
      prioridad: body.prioridad || 'media',
      estado: 'abierta' as const
    };
    const { data, error } = await supabase.from('solicitudes').insert(payload).select('id').single();
    if (error) throw error;
    await supabase.from('audit_log').insert({ actor_id: profile.id, entidad: 'solicitudes', entidad_id: data.id, accion: 'crear_solicitud', detalle: payload });
    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo crear la solicitud.' }, { status: 500 });
  }
}
