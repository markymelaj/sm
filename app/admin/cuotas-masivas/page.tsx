import { BulkQuotaGenerator } from '@/components/admin/bulk-quota-generator';
import { requireRole } from '@/lib/auth';

export default async function AdminCuotasMasivasPage() {
  const { supabase } = await requireRole(['admin']);

  const [{ data: profilesData }, { data: fichasData }] = await Promise.all([
    supabase.from('perfiles').select('id, nombre_completo, rut, identificador, parcela, activo').eq('rol', 'cliente').order('nombre_completo'),
    supabase.from('fichas_cliente').select('perfil_id, parcela, numero_rol_parcela')
  ]);

  const fichaMap = new Map<string, any>((fichasData ?? []).map((item: any) => [item.perfil_id, item]));
  const clients = (profilesData ?? []).map((profile: any) => ({
    id: profile.id,
    nombre: profile.nombre_completo,
    rut: profile.rut ?? profile.identificador,
    parcela: fichaMap.get(profile.id)?.parcela || profile.parcela || '',
    numeroRol: fichaMap.get(profile.id)?.numero_rol_parcela || '',
    activo: profile.activo
  }));

  return <BulkQuotaGenerator clients={clients} />;
}
