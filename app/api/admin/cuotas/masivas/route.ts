import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

function addMonths(dateString: string, offset: number) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, (month - 1) + offset, day || 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST(request: Request) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    const body = await request.json();
    const profileIds = Array.isArray(body.profileIds) ? body.profileIds.filter(Boolean) : [];
    const conceptoBase = String(body.concepto_base || '').trim() || 'Cuota';
    const montoTotal = Number(body.monto_total || 0);
    const fechaInicio = String(body.fecha_inicio || '').trim();
    const cantidad = Number(body.cantidad || 0);

    if (profileIds.length === 0) return NextResponse.json({ error: 'Debes seleccionar al menos un cliente.' }, { status: 400 });
    if (!Number.isFinite(montoTotal) || montoTotal <= 0) return NextResponse.json({ error: 'Debes indicar un monto válido.' }, { status: 400 });
    if (!fechaInicio) return NextResponse.json({ error: 'Debes indicar la primera fecha.' }, { status: 400 });
    if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 24) return NextResponse.json({ error: 'La cantidad de cuotas debe estar entre 1 y 24.' }, { status: 400 });

    const admin: any = createAdminClient();
    const { data: existingData } = await admin
      .from('cuotas')
      .select('perfil_id, concepto, fecha_vencimiento, monto_total')
      .in('perfil_id', profileIds);

    const existing = new Set((existingData ?? []).map((item: any) => `${item.perfil_id}::${item.concepto}::${item.fecha_vencimiento}::${Number(item.monto_total)}`));

    const inserts: any[] = [];
    for (const profileId of profileIds) {
      for (let index = 0; index < cantidad; index += 1) {
        const concepto = `${conceptoBase} ${index + 1}`;
        const fecha = addMonths(fechaInicio, index);
        const key = `${profileId}::${concepto}::${fecha}::${montoTotal}`;
        if (existing.has(key)) continue;
        inserts.push({
          perfil_id: profileId,
          concepto,
          monto_total: montoTotal,
          fecha_vencimiento: fecha,
          estado: 'pendiente'
        });
      }
    }

    if (inserts.length > 0) {
      const { data: inserted, error } = await admin.from('cuotas').insert(inserts).select('id, concepto, perfil_id');
      if (error) throw error;
      if (inserted?.length) {
        await admin.from('cuota_auditorias').insert(inserted.map((item: any) => ({
          cuota_id: item.id,
          actor_id: profile.id,
          accion: 'crear_cuota_masiva',
          detalle: item.concepto
        })));
      }
    }

    return NextResponse.json({ ok: true, created: inserts.length, skipped: profileIds.length * cantidad - inserts.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudieron generar las cuotas.' }, { status: 500 });
  }
}
