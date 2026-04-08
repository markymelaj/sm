import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { slugifyFilename } from '@/lib/rut';
import { createClient } from '@/lib/supabase/server';
import { validateUpload } from '@/lib/validators';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    const { id } = await Promise.resolve(params);
    const supabase: any = await createClient();

    const contentType = request.headers.get('content-type') ?? '';
    let concepto = '';
    let montoTotal = 0;
    let fechaVencimiento = '';
    let estado: 'pendiente' | 'pagado' = 'pendiente';
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      concepto = String(formData.get('concepto') ?? '').trim();
      montoTotal = Number(formData.get('monto_total') ?? 0);
      fechaVencimiento = String(formData.get('fecha_vencimiento') ?? '');
      estado = formData.get('estado') === 'pagado' ? 'pagado' : 'pendiente';
      const fileValue = formData.get('file');
      file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
    } else {
      const body = await request.json();
      concepto = String(body.concepto || '').trim();
      montoTotal = Number(body.monto_total || 0);
      fechaVencimiento = String(body.fecha_vencimiento || '');
      estado = body.estado === 'pagado' ? 'pagado' : 'pendiente';
    }

    const payload = {
      perfil_id: id,
      concepto,
      monto_total: montoTotal,
      fecha_vencimiento: fechaVencimiento,
      estado
    };

    const { data, error } = await supabase.from('cuotas').insert(payload).select('id').single();
    if (error) throw error;

    if (file) {
      validateUpload(file);
      const path = `${id}/${data.id}/admin-${Date.now()}-${slugifyFilename(file.name)}`;
      const bytes = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage.from('comprobantes').upload(path, bytes, {
        contentType: file.type,
        upsert: false
      });
      if (uploadError) {
        await supabase.from('cuotas').delete().eq('id', data.id);
        throw uploadError;
      }

      const { error: updateError } = await supabase.from('cuotas').update({ comprobante_url: path }).eq('id', data.id);
      if (updateError) throw updateError;
    }

    await supabase.from('cuota_auditorias').insert({
      cuota_id: data.id,
      actor_id: profile.id,
      accion: 'crear_cuota',
      detalle: `${payload.concepto} · ${payload.estado}${file ? ' · con comprobante' : ''}`
    });
    await supabase.from('audit_log').insert({ actor_id: profile.id, entidad: 'cuotas', entidad_id: data.id, accion: 'crear_cuota', detalle: { ...payload, comprobante: Boolean(file) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo crear la cuota.' }, { status: 500 });
  }
}
