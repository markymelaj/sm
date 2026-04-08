import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || !['admin', 'auditor'].includes(profile.rol)) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    const body = await request.json();
    if (!String(body.motivo || '').trim()) return NextResponse.json({ error: 'Debes indicar el motivo.' }, { status: 400 });
    const { id } = await Promise.resolve(params);
    const supabase: any = await createClient();
    const { error } = await supabase.from('cuotas').update({ estado: 'rechazado', motivo_rechazo: String(body.motivo).trim() }).eq('id', id);
    if (error) throw error;
    await supabase.from('cuota_auditorias').insert({ cuota_id: id, actor_id: profile.id, accion: 'rechazar', detalle: String(body.motivo).trim() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo rechazar.' }, { status: 500 });
  }
}
