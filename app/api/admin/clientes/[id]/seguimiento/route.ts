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
      avance_particular: String(body.avance_particular || '').trim() || null,
      updated_by: profile.id
    };

    const { error } = await supabase.from('seguimiento_parcela').update(payload).eq('perfil_id', id);
    if (error) throw error;

    await supabase.from('audit_log').insert({ actor_id: profile.id, entidad: 'seguimiento_parcela', entidad_id: id, accion: 'update_seguimiento', detalle: payload });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo actualizar el seguimiento.' }, { status: 500 });
  }
}
