import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_CODES = ['inscripcion', 'contrato_notaria', 'firmado_retiro'];

export async function PATCH(request: Request) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'cliente') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    const body = await request.json();
    const fichaId = String(body.ficha_id || '').trim();
    const valores = Array.isArray(body.valores) ? body.valores : [];
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

    const { data: tipos, error: tiposError } = await supabase
      .from('ficha_estado_tipos')
      .select('id, codigo')
      .in('codigo', ALLOWED_CODES);
    if (tiposError) throw tiposError;

    const allowedById = new Map((tipos ?? []).map((item: any) => [item.id, item.codigo]));
    const payload = valores
      .filter((item: any) => allowedById.has(item.estado_tipo_id))
      .map((item: any) => ({
        ficha_id: fichaId,
        estado_tipo_id: item.estado_tipo_id,
        valor_bool: !!item.valor_bool,
        valor_texto: null,
        valor_fecha: null,
        observacion: null,
        updated_by: profile.id
      }));

    if (!payload.length) {
      return NextResponse.json({ error: 'No hay cambios válidos para guardar.' }, { status: 400 });
    }

    const { error } = await supabase.from('ficha_estado_valores').upsert(payload, { onConflict: 'ficha_id,estado_tipo_id' });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo actualizar el estado contractual.' }, { status: 500 });
  }
}
