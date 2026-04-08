import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { cleanRut } from '@/lib/rut';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });

    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const supabase: any = await createClient();

    const payload = {
      titular_parcela: String(body.titular_parcela || '').trim() || null,
      rut_titular: String(body.rut_titular || '').trim() ? cleanRut(body.rut_titular) : null,
      numero_rol_parcela: String(body.numero_rol_parcela || '').trim() || null,
      numero_parcela: String(body.numero_parcela || '').trim() || null,
      parcela: String(body.parcela || '').trim() || null,
      telefono: String(body.telefono || '').trim() || null,
      email_contacto: String(body.email_contacto || '').trim() || null,
      direccion_referencia: String(body.direccion_referencia || '').trim() || null,
      observaciones: String(body.observaciones || '').trim() || null
    };

    const { error } = await supabase.from('fichas_cliente').update(payload).eq('perfil_id', id);
    if (error) throw error;

    await supabase.from('audit_log').insert({ actor_id: profile.id, entidad: 'fichas_cliente', entidad_id: id, accion: 'update_ficha', detalle: payload });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo actualizar la ficha.' }, { status: 500 });
  }
}
