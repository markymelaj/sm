import Link from 'next/link';

import { requireRole } from '@/lib/auth';
import {
  buildContractStatusMap,
  CONTRACT_STATUS_OPTIONS,
  FILTER_WITH_CONTRACT,
  hasContract
} from '@/lib/contracts';

export default async function AuditorPage() {
  const { supabase } = await requireRole(['auditor']);

  const [
    { count: pagos = 0 },
    { count: solicitudes = 0 },
    { data: clientesData },
    { data: fichasData },
    { data: estadoTiposData }
  ] = await Promise.all([
    supabase.from('cuotas').select('*', { count: 'exact', head: true }).eq('estado', 'en_revision'),
    supabase.from('solicitudes').select('*', { count: 'exact', head: true }).in('estado', ['abierta', 'en_revision', 'respondida']),
    supabase.from('perfiles').select('id').eq('rol', 'cliente').eq('activo', true),
    supabase.from('fichas_cliente').select('id, perfil_id'),
    supabase.from('ficha_estado_tipos').select('id, codigo').eq('is_active', true)
  ]);

  const clientes: any[] = clientesData ?? [];
  const fichas: any[] = (fichasData ?? []).filter((item: any) => clientes.some((cliente) => cliente.id === item.perfil_id));
  const fichaIds = fichas.map((item) => item.id);
  const estadoTipos: any[] = estadoTiposData ?? [];
  const { data: estadoValoresData } = fichaIds.length
    ? await supabase.from('ficha_estado_valores').select('ficha_id, estado_tipo_id, valor_bool, valor_texto').in('ficha_id', fichaIds)
    : { data: [] };

  const contractStatusByProfile = buildContractStatusMap(fichas, estadoTipos, estadoValoresData ?? []);
  const inscritos = clientes.length;
  const conContrato = clientes.filter((item) => hasContract(contractStatusByProfile.get(item.id))).length;
  const contractCounts = Object.fromEntries(
    CONTRACT_STATUS_OPTIONS.map((status) => [status, clientes.filter((item) => contractStatusByProfile.get(item.id) === status).length])
  ) as Record<string, number>;

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Pagos en revisión</p><h2 className="mt-2 text-2xl font-bold text-white">{pagos}</h2></div>
        <div className="card p-5"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Solicitudes pendientes</p><h2 className="mt-2 text-2xl font-bold text-white">{solicitudes}</h2></div>
        <Link className="card p-5" href="/auditor/clientes"><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Inscritos</p><h2 className="mt-2 text-2xl font-bold text-white">{inscritos}</h2><p className="muted mt-2 text-sm">Ver cartera completa.</p></Link>
        <Link className="card p-5" href={`/auditor/clientes?contrato=${FILTER_WITH_CONTRACT}`}><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Con contrato</p><h2 className="mt-2 text-2xl font-bold text-white">{conContrato}</h2><p className="muted mt-2 text-sm">Clientes con contrato en curso o finalizado.</p></Link>
        <Link className="card p-5" href={`/auditor/clientes?contrato=${encodeURIComponent('Listo para retiro del cliente')}`}><p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Listos para retiro</p><h2 className="mt-2 text-2xl font-bold text-white">{contractCounts['Listo para retiro del cliente']}</h2><p className="muted mt-2 text-sm">Documentos listos para entregar.</p></Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link className="card p-5" href={`/auditor/clientes?contrato=${encodeURIComponent('Pendiente de enviar a notaría')}`}>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Enviar a notaría</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{contractCounts['Pendiente de enviar a notaría']}</h2>
        </Link>
        <Link className="card p-5" href={`/auditor/clientes?contrato=${encodeURIComponent('Pendiente de firma de René en notaría')}`}>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Firma de René</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{contractCounts['Pendiente de firma de René en notaría']}</h2>
        </Link>
        <Link className="card p-5" href={`/auditor/clientes?contrato=${encodeURIComponent('Contrato entregado')}`}>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Contratos entregados</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{contractCounts['Contrato entregado']}</h2>
        </Link>
      </section>
    </div>
  );
}
