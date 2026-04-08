import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || !['admin', 'auditor'].includes(profile.rol)) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    const { id } = await Promise.resolve(params);
    const supabase: any = await createClient();
    const { error } = await supabase.from('cuotas').update({ estado: 'pagado', motivo_rechazo: null }).eq('id', id);
    if (error) throw error;
    await supabase.from('cuota_auditorias').insert({ cuota_id: id, actor_id: profile.id, accion: 'aprobar', detalle: 'Comprobante validado' });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo aprobar.' }, { status: 500 });
  }
}
