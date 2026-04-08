import Link from 'next/link';

import { formatCurrency } from '@/lib/format';
import { requireRole } from '@/lib/auth';
import {
  buildContractStatusMap,
  CONTRACT_STATUS_OPTIONS,
  FILTER_WITH_CONTRACT,
  hasContract
} from '@/lib/contracts';

export default async function AdminDashboardPage() {
  const { supabase } = await requireRole(['admin']);

  const [
    { data: cuotasData },
    { data: clientesData },
    { data: fichasData },
    { data: estadoTiposData },
    { count: solicitudesActivas = 0 }
  ] = await Promise.all([
    supabase.from('cuotas').select('monto_total, estado', { count: 'exact' }),
    supabase.from('perfiles').select('id, activo, rol').eq('rol', 'cliente').eq('activo', true),
    supabase.from('fichas_cliente').select('id, perfil_id'),
    supabase.from('ficha_estado_tipos').select('id, codigo').eq('is_active', true),
    supabase.from('solicitudes').select('*', { count: 'exact', head: true }).in('estado', ['abierta', 'en_revision'])
  ]);

  const cuotas: any[] = cuotasData ?? [];
  const clientes: any[] = clientesData ?? [];
  const fichas: any[] = (fichasData ?? []).filter((item: any) => clientes.some((cliente) => cliente.id === item.perfil_id));
  const fichaIds = fichas.map((item) => item.id);
  const estadoTipos: any[] = estadoTiposData ?? [];
  const { data: estadoValoresData } = fichaIds.length
    ? await supabase.from('ficha_estado_valores').select('ficha_id, estado_tipo_id, valor_bool, valor_texto').in('ficha_id', fichaIds)
    : { data: [] };

  const contractStatusByProfile = buildContractStatusMap(fichas, estadoTipos, estadoValoresData ?? []);

  const paid = cuotas.filter((item) => item.estado === 'pagado').reduce((sum, item) => sum + Number(item.monto_total), 0);
  const pending = cuotas.filter((item) => item.estado !== 'pagado').reduce((sum, item) => sum + Number(item.monto_total), 0);
  const review = cuotas.filter((item) => item.estado === 'en_revision').length;
  const inscritos = clientes.length;
  const conContrato = clientes.filter((item) => hasContract(contractStatusByProfile.get(item.id))).length;

  const contractCounts = Object.fromEntries(
    CONTRACT_STATUS_OPTIONS.map((status) => [status, clientes.filter((item) => contractStatusByProfile.get(item.id) === status).length])
  ) as Record<string, number>;

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Recaudado</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(paid)}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Por cobrar</p><h2 className="mt-2 text-2xl font-bold text-white">{formatCurrency(pending)}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Pagos en revisión</p><h2 className="mt-2 text-2xl font-bold text-white">{review}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Solicitudes activas</p><h2 className="mt-2 text-2xl font-bold text-white">{solicitudesActivas}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Clientes activos</p><h2 className="mt-2 text-2xl font-bold text-white">{clientes.length}</h2></div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Link className="card p-5" href="/admin/clientes">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Inscritos</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{inscritos}</h2>
          <p className="muted mt-2 text-sm">Ver todos los clientes activos.</p>
        </Link>
        <Link className="card p-5" href={`/admin/clientes?contrato=${FILTER_WITH_CONTRACT}`}>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Con contrato</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{conContrato}</h2>
          <p className="muted mt-2 text-sm">Clientes con gestión contractual en curso o finalizada.</p>
        </Link>
        <Link className="card p-5" href={`/admin/clientes?contrato=${encodeURIComponent('Pendiente de enviar a notaría')}`}>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Enviar a notaría</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{contractCounts['Pendiente de enviar a notaría']}</h2>
          <p className="muted mt-2 text-sm">Pendientes de preparar y enviar.</p>
        </Link>
        <Link className="card p-5" href={`/admin/clientes?contrato=${encodeURIComponent('Pendiente de firma de René en notaría')}`}>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Firma de René</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{contractCounts['Pendiente de firma de René en notaría']}</h2>
          <p className="muted mt-2 text-sm">Documentos listos esperando firma.</p>
        </Link>
        <Link className="card p-5" href={`/admin/clientes?contrato=${encodeURIComponent('Listo para retiro del cliente')}`}>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Listos para retiro</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{contractCounts['Listo para retiro del cliente']}</h2>
          <p className="muted mt-2 text-sm">Clientes que ya pueden retirar su contrato.</p>
        </Link>
      </section>

      <section className="card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
        <Link className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" href="/admin/clientes"><p className="text-lg font-bold text-white">Clientes</p><p className="muted mt-2 text-sm">Fichas, estados, seguimiento y pagos.</p></Link>
        <Link className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" href="/admin/usuarios"><p className="text-lg font-bold text-white">Usuarios internos</p><p className="muted mt-2 text-sm">Admin y auditores del sistema.</p></Link>
        <Link className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" href="/admin/usuarios/alta"><p className="text-lg font-bold text-white">Alta de usuario</p><p className="muted mt-2 text-sm">Crear clientes o auditores con acceso listo.</p></Link>
        <Link className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" href="/admin/pagos"><p className="text-lg font-bold text-white">Validación de pagos</p><p className="muted mt-2 text-sm">Aprobar, rechazar y registrar auditoría.</p></Link>
        <Link className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" href="/admin/solicitudes"><p className="text-lg font-bold text-white">Solicitudes y consultas</p><p className="muted mt-2 text-sm">Responder, aprobar, rechazar o cerrar casos.</p></Link>
      </section>
    </div>
  );
}
