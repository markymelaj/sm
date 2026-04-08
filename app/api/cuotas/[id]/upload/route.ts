import { NextResponse } from 'next/server';

import { getSessionProfile } from '@/lib/auth';
import { slugifyFilename } from '@/lib/rut';
import { createClient } from '@/lib/supabase/server';
import { validateUpload } from '@/lib/validators';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, supabase: sessionSupabase } = await getSessionProfile();
    const supabase: any = sessionSupabase;
    if (!profile || profile.rol !== 'cliente') return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    const { id } = await Promise.resolve(params);
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Archivo inválido.' }, { status: 400 });
    validateUpload(file);

    const path = `${profile.id}/${id}/${Date.now()}-${slugifyFilename(file.name)}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage.from('comprobantes').upload(path, bytes, {
      contentType: file.type,
      upsert: false
    });
    if (uploadError) throw uploadError;

    const { error } = await supabase.from('cuotas').update({ comprobante_url: path, estado: 'en_revision' }).eq('id', id).eq('perfil_id', profile.id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo subir el comprobante.' }, { status: 500 });
  }
}
