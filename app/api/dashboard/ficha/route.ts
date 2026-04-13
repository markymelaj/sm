import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'cliente') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    const body = await request.json();
    const fichaId = String(body.ficha_id || '').trim();
    if (!fichaId) {
      return NextResponse.json({ error: 'Falta la ficha.' }, { status: 400 });
    }

    const supabase: any = await createClient();
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_cliente')
      .select('id, perfil_id')
      .eq('id', fichaId)
      .maybeSingle();

    if (fichaError) throw fichaError;
    if (!ficha || ficha.perfil_id !== profile.id) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    const payload = {
      numero_rol_parcela: String(body.numero_rol_parcela || '').trim() || null
    };

    const { error } = await supabase.from('fichas_cliente').update(payload).eq('id', fichaId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo actualizar la ficha.' }, { status: 500 });
  }
}
