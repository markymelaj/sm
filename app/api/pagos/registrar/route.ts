import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { CLIENT_PAYMENT_TYPE_OPTIONS } from '@/lib/constants';
import { slugifyFilename } from '@/lib/rut';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateUpload } from '@/lib/validators';

const TYPE_LABELS = Object.fromEntries(CLIENT_PAYMENT_TYPE_OPTIONS.map((item) => [item.value, item.label])) as Record<string, string>;

export async function POST(request: Request) {
  let uploadedPath: string | null = null;

  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'cliente') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    const formData = await request.formData();
    const monto = Number(formData.get('monto_total') ?? 0);
    const detalle = String(formData.get('detalle') ?? '').trim();
    const tipoPago = String(formData.get('tipo_pago') ?? '').trim();
    const fechaPago = String(formData.get('fecha_pago') ?? '').trim();
    const file = formData.get('file');

    if (!Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json({ error: 'Debes indicar un monto válido.' }, { status: 400 });
    }

    if (!detalle) {
      return NextResponse.json({ error: 'Debes indicar un detalle del pago.' }, { status: 400 });
    }

    if (!TYPE_LABELS[tipoPago]) {
      return NextResponse.json({ error: 'Selecciona si corresponde a cuota, pie o adelanto.' }, { status: 400 });
    }

    if (!fechaPago) {
      return NextResponse.json({ error: 'Debes indicar la fecha del pago.' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Debes adjuntar el comprobante del pago.' }, { status: 400 });
    }

    validateUpload(file);

    const admin: any = createAdminClient();
    const cuotaId = randomUUID();
    uploadedPath = `${profile.id}/${cuotaId}/${Date.now()}-${slugifyFilename(file.name)}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await admin.storage.from('comprobantes').upload(uploadedPath, bytes, {
      contentType: file.type,
      upsert: false
    });

    if (uploadError) throw uploadError;

    const concepto = `Pago informado por cliente · ${TYPE_LABELS[tipoPago]} · ${detalle}`;

    const { error: insertError } = await admin.from('cuotas').insert({
      id: cuotaId,
      perfil_id: profile.id,
      concepto,
      monto_total: monto,
      fecha_vencimiento: fechaPago,
      estado: 'en_revision',
      comprobante_url: uploadedPath,
      motivo_rechazo: null,
      transaccion_id: null
    });

    if (insertError) throw insertError;

    await admin.from('cuota_auditorias').insert({
      cuota_id: cuotaId,
      actor_id: profile.id,
      accion: 'registro_cliente',
      detalle: `${TYPE_LABELS[tipoPago]} · ${detalle}`
    });

    await admin.from('audit_log').insert({
      actor_id: profile.id,
      entidad: 'cuotas',
      entidad_id: cuotaId,
      accion: 'registrar_pago_cliente',
      detalle: {
        tipo_pago: tipoPago,
        detalle,
        monto_total: monto,
        fecha_pago: fechaPago
      }
    });

    return NextResponse.json({ ok: true, cuotaId });
  } catch (error) {
    if (uploadedPath) {
      try {
        const admin: any = createAdminClient();
        await admin.storage.from('comprobantes').remove([uploadedPath]);
      } catch {
        // noop
      }
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo registrar el pago.' }, { status: 500 });
  }
}
