import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'cliente') return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    const { id } = await Promise.resolve(params);
    const supabase: any = await createClient();
    const { error } = await supabase.from('cuotas').update({ estado: 'en_revision', transaccion_id: `SIM-${Date.now()}` }).eq('id', id).eq('perfil_id', profile.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo registrar el pago.' }, { status: 500 });
  }
}
