import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { parseConsolidatedCsv, normalizeSystemStatus } from '@/lib/csv-import';
import { createAdminClient } from '@/lib/supabase/admin';

type MatchResult = {
  row: ReturnType<typeof parseConsolidatedCsv>[number];
  matchType: string;
  target: any | null;
  safeToApply: boolean;
};

async function buildMatches(rows: ReturnType<typeof parseConsolidatedCsv>) {
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
    if (direct) {
      return { row, matchType: 'RUT', target: direct, safeToApply: true } satisfies MatchResult;
    }

    const parcelaMatches = row.parcela ? byParcela.get(String(row.parcela).trim()) ?? [] : [];
    if (parcelaMatches.length === 1) {
      return { row, matchType: 'Parcela', target: parcelaMatches[0], safeToApply: true } satisfies MatchResult;
    }

    if (parcelaMatches.length > 1) {
      return { row, matchType: 'Conflicto parcela', target: null, safeToApply: false } satisfies MatchResult;
    }

    return { row, matchType: 'Sin match', target: null, safeToApply: false } satisfies MatchResult;
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
    const matches = await buildMatches(rows);

    return NextResponse.json({
      summary: {
        rows: matches.length,
        matched: matches.filter((item) => item.target).length,
        safe: matches.filter((item) => item.safeToApply).length,
        conflicts: matches.filter((item) => item.matchType.includes('Conflicto')).length,
        missing: matches.filter((item) => item.matchType === 'Sin match').length
      },
      rows: matches.slice(0, 120).map((item) => ({
        parcela: item.row.parcela,
        rut: item.row.rut,
        titular: item.row.propietario,
        rol: item.row.rol,
        matchType: item.matchType,
        targetName: item.target?.nombre_completo ?? null,
        targetRut: item.target?.rut ?? null,
        systemStatus: normalizeSystemStatus(item.row.estadoSistema),
        safeToApply: item.safeToApply
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo analizar el archivo.' }, { status: 500 });
  }
}
