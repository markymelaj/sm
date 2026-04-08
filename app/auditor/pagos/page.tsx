import { ApproveRejectControls } from '@/components/admin/approve-reject-controls';
import { StatusBadge } from '@/components/status-badge';
import { requireRole } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/format';

export default async function AuditorPagosPage() {
  const { supabase } = await requireRole(['auditor']);
  const { data } = await supabase.from('cuotas').select('*, perfiles(nombre_completo)').eq('estado', 'en_revision').order('updated_at', { ascending: false });
  const cuotas: any[] = data ?? [];

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
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Pagos en revisión</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {cuotas.map((cuota: any) => (
          <article className="rounded-2xl border border-white/8 bg-slate-900/45 p-4" key={cuota.id}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-white">{cuota.concepto}</h3><p className="muted text-sm">{cuota.perfiles?.nombre_completo || 'Cliente'} · {formatDate(cuota.fecha_vencimiento)}</p></div><StatusBadge label={cuota.estado} /></div>
            <p className="mt-3 text-xl font-bold text-white">{formatCurrency(cuota.monto_total)}</p>
            {comprobanteUrls[cuota.id] ? <a className="mt-3 inline-flex text-sm font-semibold text-sky-300 underline" href={comprobanteUrls[cuota.id]!} rel="noreferrer" target="_blank">Abrir comprobante</a> : null}
            <div className="mt-4"><ApproveRejectControls quotaId={cuota.id} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}
