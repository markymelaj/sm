import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { normalizeSystemStatus, parseConsolidatedCsv } from '@/lib/csv-import';
import { createAdminClient } from '@/lib/supabase/admin';

async function resolveMatches(rows: ReturnType<typeof parseConsolidatedCsv>) {
  const admin: any = createAdminClient();
  const [{ data: profilesData }, { data: fichasData }] = await Promise.all([
    admin.from('perfiles').select('*').eq('rol', 'cliente'),
    admin.from('fichas_cliente').select('*')
  ]);

  const profiles: any[] = profilesData ?? [];
  const fichas: any[] = fichasData ?? [];
  const byRut = new Map<string, any>();
  const byParcela = new Map<string, any[]>();
  const fichaByProfile = new Map<string, any>(fichas.map((item) => [item.perfil_id, item]));

  for (const profile of profiles) {
    if (profile.rut) byRut.set(profile.rut, profile);
    const key = String(profile.parcela || fichaByProfile.get(profile.id)?.parcela || '').trim();
    if (key) {
      const bucket = byParcela.get(key) ?? [];
      bucket.push(profile);
      byParcela.set(key, bucket);
    }
  }

  return rows.map((row) => {
    const direct = row.rut ? byRut.get(row.rut) ?? null : null;
    if (direct) return { row, target: direct, safeToApply: true };
    const parcelaMatches = row.parcela ? byParcela.get(String(row.parcela).trim()) ?? [] : [];
    if (parcelaMatches.length === 1) return { row, target: parcelaMatches[0], safeToApply: true };
    return { row, target: null, safeToApply: false };
  });
}

export async function POST(request: Request) {
  try {
    const { profile } = await getSessionProfile();
    if (!profile || profile.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Debes adjuntar un CSV.' }, { status: 400 });
    }

    const content = new TextDecoder('latin1').decode(await file.arrayBuffer());
    const rows = parseConsolidatedCsv(content);
    const matches = await resolveMatches(rows);
    const admin: any = createAdminClient();

    let updated = 0;
    let conflicts = 0;

    for (const item of matches) {
      if (!item.safeToApply || !item.target) {
        conflicts += 1;
        continue;
      }

      const { data: ficha } = await admin.from('fichas_cliente').select('*').eq('perfil_id', item.target.id).maybeSingle();
      const profilePatch: Record<string, unknown> = {};
      const fichaPatch: Record<string, unknown> = {};

      if (item.row.parcela && !item.target.parcela) profilePatch.parcela = item.row.parcela;
      const normalizedStatus = normalizeSystemStatus(item.row.estadoSistema);
      if (normalizedStatus === 'sin_alta' && item.target.activo !== false) profilePatch.activo = false;

      if (!ficha) {
        fichaPatch.perfil_id = item.target.id;
      }

      const currentFicha = ficha ?? {};
      if (item.row.propietario && !currentFicha.titular_parcela) fichaPatch.titular_parcela = item.row.propietario;
      if (item.row.rut && !currentFicha.rut_titular) fichaPatch.rut_titular = item.row.rut;
      if (item.row.rol && !currentFicha.numero_rol_parcela) fichaPatch.numero_rol_parcela = item.row.rol;
      if (item.row.parcela && !currentFicha.parcela) fichaPatch.parcela = item.row.parcela;
      if (item.row.parcela && !currentFicha.numero_parcela) fichaPatch.numero_parcela = item.row.parcela;
      if (item.row.telefonos && !currentFicha.telefono) fichaPatch.telefono = item.row.telefonos;
      if (item.row.observaciones && !currentFicha.observaciones) fichaPatch.observaciones = item.row.observaciones;

      if (Object.keys(profilePatch).length > 0) {
        const { error } = await admin.from('perfiles').update(profilePatch).eq('id', item.target.id);
        if (error) throw error;
      }

      if (Object.keys(fichaPatch).length > 0) {
        const { error } = await admin.from('fichas_cliente').upsert(fichaPatch, { onConflict: 'perfil_id' });
        if (error) throw error;
      }

      if (Object.keys(profilePatch).length > 0 || Object.keys(fichaPatch).length > 0) {
        updated += 1;
      }
    }

    return NextResponse.json({ ok: true, updated, conflicts });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo aplicar la importación.' }, { status: 500 });
  }
}
