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
      nombre_completo: String(body.nombre_completo || '').trim(),
      email: String(body.email || '').trim() || null,
      parcela: String(body.parcela || '').trim() || null,
      activo: Boolean(body.activo)
    };

    const { error } = await supabase.from('perfiles').update(payload).eq('id', id);
    if (error) throw error;

    await supabase.from('audit_log').insert({ actor_id: profile.id, entidad: 'perfiles', entidad_id: id, accion: 'update_perfil', detalle: payload });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo actualizar el perfil.' }, { status: 500 });
  }
}
