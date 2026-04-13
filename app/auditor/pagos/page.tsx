import { ApproveRejectControls } from '@/components/admin/approve-reject-controls';
import { StatusBadge } from '@/components/status-badge';
import { matchesClientSearch, normalizeClientSearch } from '@/lib/client-search';
import { requireRole } from '@/lib/auth';
import { formatCurrency, formatDate, formatIdentifier } from '@/lib/format';
import { getPaymentOriginLabel, inferPaymentOrigin, sortQuotasByUpdatedDesc } from '@/lib/payments';

const TABS = [
  { key: 'revision', label: 'En revisión' },
  { key: 'aprobados', label: 'Aprobados recientes' },
  { key: 'cliente', label: 'Cargados por cliente' },
  { key: 'rechazados', label: 'Rechazados' }
] as const;

export default async function AuditorPagosPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const { supabase } = await requireRole(['auditor']);
  const { tab = 'revision', q = '' } = await searchParams;

  const [{ data: cuotasData }, { data: auditoriasData }, { data: fichasData }] = await Promise.all([
    supabase
      .from('cuotas')
      .select('id, perfil_id, concepto, monto_total, fecha_vencimiento, estado, comprobante_url, motivo_rechazo, updated_at, created_at, perfiles(nombre_completo, identificador, rut, parcela)')
      .order('updated_at', { ascending: false }),
    supabase.from('cuota_auditorias').select('cuota_id, actor_id, accion, detalle, created_at'),
    supabase.from('fichas_cliente').select('perfil_id, parcela, numero_rol_parcela')
  ]);

  const auditorias: any[] = auditoriasData ?? [];
  const fichaMap = new Map<string, any>((fichasData ?? []).map((item: any) => [item.perfil_id, item]));
  const normalizedTab = TABS.some((item) => item.key === tab) ? tab : 'revision';
  const query = normalizeClientSearch(q);

  const cuotas = sortQuotasByUpdatedDesc((cuotasData ?? []) as any[])
    .map((cuota: any) => ({
      ...cuota,
      origen: inferPaymentOrigin(cuota.id, auditorias as any),
      ficha: fichaMap.get(cuota.perfil_id) ?? null
    }))
    .filter((cuota: any) => {
      if (normalizedTab === 'revision') return cuota.estado === 'en_revision';
      if (normalizedTab === 'aprobados') return cuota.estado === 'pagado';
      if (normalizedTab === 'cliente') return cuota.origen === 'cliente';
      if (normalizedTab === 'rechazados') return cuota.estado === 'rechazado';
      return true;
    })
    .filter((cuota: any) =>
      matchesClientSearch(query, [
        cuota.perfiles?.nombre_completo,
        cuota.perfiles?.rut,
        cuota.perfiles?.identificador,
        cuota.perfiles?.parcela,
        cuota.ficha?.parcela,
        cuota.ficha?.numero_rol_parcela,
        cuota.concepto
      ])
    )
    .slice(0, normalizedTab === 'aprobados' ? 50 : 200);

  const comprobanteUrls = Object.fromEntries(
    await Promise.all(
      cuotas
        .filter((item: any) => item.comprobante_url)
        .map(async (item: any) => {
          const { data } = await supabase.storage.from('comprobantes').createSignedUrl(item.comprobante_url as string, 3600);
          return [item.id, data?.signedUrl ?? null];
        })
    )
  );

  return (
    <section className="card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Pagos</p>
          <p className="muted mt-2 text-sm">Revisa pagos aprobados, rechazados y origen del registro.</p>
        </div>
        <form className="w-full lg:max-w-md" method="get">
          <input type="hidden" name="tab" value={normalizedTab} />
          <input className="input" defaultValue={q} name="q" placeholder="Buscar por cliente, RUT, parcela o concepto" />
        </form>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <a
            key={item.key}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${normalizedTab === item.key ? 'border-sky-300/40 bg-sky-400/15 text-sky-200' : 'border-white/10 bg-slate-900/45 text-slate-200'}`}
            href={`/auditor/pagos?tab=${item.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
          >
            {item.label}
          </a>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {cuotas.map((cuota: any) => (
          <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={cuota.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">{cuota.concepto}</h3>
                <p className="muted text-sm">{cuota.perfiles?.nombre_completo || 'Cliente'} · {formatIdentifier(cuota.perfiles?.rut ?? cuota.perfiles?.identificador)}</p>
                <p className="muted text-sm">Parcela {cuota.ficha?.parcela || cuota.perfiles?.parcela || '—'} · Rol {cuota.ficha?.numero_rol_parcela || '—'}</p>
                <p className="muted text-sm">Fecha de pago {formatDate(cuota.fecha_vencimiento)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge label={cuota.estado} />
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">{getPaymentOriginLabel(cuota.origen)}</span>
              </div>
            </div>
            <p className="mt-3 text-xl font-bold text-white">{formatCurrency(cuota.monto_total)}</p>
            {cuota.motivo_rechazo ? <p className="mt-2 text-sm text-rose-300">Motivo: {cuota.motivo_rechazo}</p> : null}
            {comprobanteUrls[cuota.id] ? <a className="mt-3 inline-flex text-sm font-semibold text-sky-300 underline" href={comprobanteUrls[cuota.id]!} rel="noreferrer" target="_blank">Abrir comprobante</a> : null}
            {cuota.estado === 'en_revision' ? <div className="mt-3"><ApproveRejectControls quotaId={cuota.id} /></div> : null}
          </article>
        ))}
      </div>
      {cuotas.length === 0 ? <p className="muted mt-4 text-sm">No hay pagos para ese filtro.</p> : null}
    </section>
  );
}
