import { NextResponse } from 'next/server';

import { cleanRut } from '@/lib/rut';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rut = cleanRut(String(body.rut || ''));
    const parcela = String(body.parcela || '').trim();
    const nombre = String(body.nombre_completo || '').trim();
    const telefono = String(body.telefono || '').trim();
    const email = String(body.email || '').trim() || null;

    if (!rut || !parcela || !nombre || !telefono) {
      return NextResponse.json({ error: 'Debes completar nombre, RUT, parcela y teléfono.' }, { status: 400 });
    }

    const admin: any = createAdminClient();

    const { data: existingPending } = await admin
      .from('solicitudes_acceso')
      .select('id')
      .eq('rut', rut)
      .eq('parcela', parcela)
      .eq('estado', 'pendiente')
      .maybeSingle();

    if (existingPending) {
      return NextResponse.json({ error: 'Ya existe una solicitud pendiente para este RUT y parcela.' }, { status: 409 });
    }

    const { data: existingProfile } = await admin
      .from('perfiles')
      .select('id, activo')
      .eq('rol', 'cliente')
      .eq('rut', rut)
      .maybeSingle();

    if (existingProfile?.activo) {
      return NextResponse.json({ error: 'Este RUT ya tiene acceso activo. Si necesitas ayuda, contáctanos para recuperar tu clave.' }, { status: 409 });
    }

    const { error } = await admin.from('solicitudes_acceso').insert({
      rut,
      parcela,
      nombre_completo: nombre,
      telefono,
      email,
      perfil_id: existingProfile?.id ?? null,
      estado: 'pendiente'
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo enviar la solicitud.' }, { status: 500 });
  }
}
