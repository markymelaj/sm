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

    const payload: Record<string, unknown> = {};

    if ('titular_parcela' in body) payload.titular_parcela = String(body.titular_parcela || '').trim() || null;
    if ('rut_titular' in body) payload.rut_titular = String(body.rut_titular || '').trim() ? cleanRut(body.rut_titular) : null;
    if ('numero_rol_parcela' in body) payload.numero_rol_parcela = String(body.numero_rol_parcela || '').trim() || null;
    if ('parcela' in body) payload.parcela = String(body.parcela || '').trim() || null;
    if ('telefono' in body) payload.telefono = String(body.telefono || '').trim() || null;
    if ('email_contacto' in body) payload.email_contacto = String(body.email_contacto || '').trim() || null;
    if ('direccion_referencia' in body) payload.direccion_referencia = String(body.direccion_referencia || '').trim() || null;
    if ('observaciones' in body) payload.observaciones = String(body.observaciones || '').trim() || null;

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No hay cambios para guardar.' }, { status: 400 });
    }

    const { error } = await supabase.from('fichas_cliente').update(payload).eq('perfil_id', id);
    if (error) throw error;

    if ('parcela' in payload) {
      const { error: profileError } = await supabase.from('perfiles').update({ parcela: payload.parcela }).eq('id', id);
      if (profileError) throw profileError;
    }

    await supabase.from('audit_log').insert({ actor_id: profile.id, entidad: 'fichas_cliente', entidad_id: id, accion: 'update_ficha', detalle: payload });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo actualizar la ficha.' }, { status: 500 });
  }
}
