import { SolicitudesBoard } from '@/components/admin/solicitudes-board';
import { requireRole } from '@/lib/auth';

export default async function AdminSolicitudesPage() {
  const { supabase } = await requireRole(['admin']);
  const { data: solicitudesData, error } = await supabase.from('solicitudes').select('*').order('updated_at', { ascending: false });

  if (error) {
    return (
      <section className="card p-5">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Solicitudes</p>
        <p className="mt-4 text-sm text-rose-300">No se pudieron cargar las solicitudes. Intenta recargar esta vista.</p>
      </section>
    );
  }

  const solicitudes: any[] = solicitudesData ?? [];
  const perfilIds = [...new Set(solicitudes.map((item) => item.perfil_id).filter(Boolean))];
  const solicitudIds = solicitudes.map((item) => item.id);

  const [{ data: perfilesData }, { data: fichasData }, { data: mensajesData }] = await Promise.all([
    perfilIds.length ? supabase.from('perfiles').select('id, nombre_completo, parcela').in('id', perfilIds) : Promise.resolve({ data: [] as any[] }),
    perfilIds.length ? supabase.from('fichas_cliente').select('perfil_id, parcela, numero_rol_parcela').in('perfil_id', perfilIds) : Promise.resolve({ data: [] as any[] }),
    solicitudIds.length ? supabase.from('solicitud_mensajes').select('*').in('solicitud_id', solicitudIds).order('created_at', { ascending: true }) : Promise.resolve({ data: [] as any[] })
  ]);

  const perfilesMap = new Map<string, any>((perfilesData ?? []).map((item: any) => [item.id, item]));
  const fichasMap = new Map<string, any>((fichasData ?? []).map((item: any) => [item.perfil_id, item]));

  const items = solicitudes.map((solicitud: any) => {
    const perfil = perfilesMap.get(solicitud.perfil_id);
    const ficha = fichasMap.get(solicitud.perfil_id);
    return {
      ...solicitud,
      clienteNombre: perfil?.nombre_completo || 'Cliente',
      parcela: ficha?.parcela || perfil?.parcela || null,
      numeroRol: ficha?.numero_rol_parcela || null
    };
  });

  return <SolicitudesBoard accent="amber" emptyLabel="No hay casos cargados." mensajes={(mensajesData ?? []) as any[]} solicitudes={items as any[]} title="Solicitudes" />;
}
