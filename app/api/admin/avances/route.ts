import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    const body = await request.json();
    const supabase: any = await createClient();
    const payload = {
      titulo: String(body.titulo || '').trim(),
      descripcion: String(body.descripcion || '').trim(),
      fecha: body.fecha || new Date().toISOString().slice(0, 10),
      created_by: profile.id
    };
    const { error } = await supabase.from('avances_obra').insert(payload);
    if (error) throw error;
    await supabase.from('audit_log').insert({ actor_id: profile.id, entidad: 'avances_obra', accion: 'crear_avance', detalle: payload });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo crear el avance.' }, { status: 500 });
  }
}
