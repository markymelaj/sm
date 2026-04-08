import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { slugifyFilename } from '@/lib/rut';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateUpload } from '@/lib/validators';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let uploadedPath: string | null = null;

  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });

    const { id } = await Promise.resolve(params);
    const contentType = request.headers.get('content-type') ?? '';

    let concepto = '';
    let montoTotal = 0;
    let fechaVencimiento = '';
    let estado: 'pendiente' | 'pagado' = 'pendiente';
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      concepto = String(formData.get('concepto') || '').trim();
      montoTotal = Number(formData.get('monto_total') || 0);
      fechaVencimiento = String(formData.get('fecha_vencimiento') || '').trim();
      estado = formData.get('estado') === 'pagado' ? 'pagado' : 'pendiente';
      const maybeFile = formData.get('file');
      if (maybeFile instanceof File && maybeFile.size > 0) {
        file = maybeFile;
      }
    } else {
      const body = await request.json();
      concepto = String(body.concepto || '').trim();
      montoTotal = Number(body.monto_total || 0);
      fechaVencimiento = String(body.fecha_vencimiento || '').trim();
      estado = body.estado === 'pagado' ? 'pagado' : 'pendiente';
    }

    if (!concepto) {
      return NextResponse.json({ error: 'Debes indicar el concepto.' }, { status: 400 });
    }

    if (!Number.isFinite(montoTotal) || montoTotal <= 0) {
      return NextResponse.json({ error: 'Debes indicar un monto válido.' }, { status: 400 });
    }

    if (!fechaVencimiento) {
      return NextResponse.json({ error: 'Debes indicar la fecha de pago.' }, { status: 400 });
    }

    const admin: any = createAdminClient();
    const cuotaId = randomUUID();

    if (file) {
      validateUpload(file);
      uploadedPath = `${id}/${cuotaId}/${Date.now()}-${slugifyFilename(file.name)}`;
      const bytes = await file.arrayBuffer();
      const { error: uploadError } = await admin.storage.from('comprobantes').upload(uploadedPath, bytes, {
        contentType: file.type,
        upsert: false
      });
      if (uploadError) throw uploadError;
    }

    const payload = {
      id: cuotaId,
      perfil_id: id,
      concepto,
      monto_total: montoTotal,
      fecha_vencimiento: fechaVencimiento,
      estado,
      comprobante_url: uploadedPath,
      motivo_rechazo: null,
      transaccion_id: null
    };

    const { error } = await admin.from('cuotas').insert(payload);
    if (error) throw error;

    await admin.from('cuota_auditorias').insert({
      cuota_id: cuotaId,
      actor_id: profile.id,
      accion: 'crear_cuota',
      detalle: `${payload.concepto} · ${payload.estado}`
    });

    await admin.from('audit_log').insert({
      actor_id: profile.id,
      entidad: 'cuotas',
      entidad_id: cuotaId,
      accion: 'crear_cuota',
      detalle: payload
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (uploadedPath) {
      try {
        const admin: any = createAdminClient();
        await admin.storage.from('comprobantes').remove([uploadedPath]);
      } catch {
        // noop
      }
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo crear la cuota.' }, { status: 500 });
  }
}
