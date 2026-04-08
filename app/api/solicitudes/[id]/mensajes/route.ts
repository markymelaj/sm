import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const supabase: any = await createClient();
    const { data: solicitud } = await supabase.from('solicitudes').select('id, perfil_id').eq('id', id).single();
    if (!solicitud) return NextResponse.json({ error: 'Solicitud no encontrada.' }, { status: 404 });
    if (profile.rol === 'cliente' && solicitud.perfil_id !== profile.id) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });

    const payload = {
      solicitud_id: id,
      autor_id: profile.id,
      mensaje: String(body.mensaje || '').trim(),
      es_interno: profile.rol === 'cliente' ? false : Boolean(body.es_interno)
    };

    const { error } = await supabase.from('solicitud_mensajes').insert(payload);
    if (error) throw error;
    await supabase.from('solicitudes').update({ estado: profile.rol === 'cliente' ? 'abierta' : 'respondida' }).eq('id', id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo enviar el mensaje.' }, { status: 500 });
  }
}
