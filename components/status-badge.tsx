type Status =
  | 'pendiente'
  | 'en_revision'
  | 'pagado'
  | 'rechazado'
  | 'abierta'
  | 'respondida'
  | 'aprobada'
  | 'cerrada'
  | 'activo'
  | 'inactivo';

const classes: Record<Status, string> = {
  pendiente: 'bg-amber-400/15 text-amber-200 border border-amber-300/20',
  en_revision: 'bg-sky-400/15 text-sky-200 border border-sky-300/20',
  pagado: 'bg-emerald-400/15 text-emerald-200 border border-emerald-300/20',
  rechazado: 'bg-rose-400/15 text-rose-200 border border-rose-300/20',
  abierta: 'bg-amber-400/15 text-amber-200 border border-amber-300/20',
  respondida: 'bg-sky-400/15 text-sky-200 border border-sky-300/20',
  aprobada: 'bg-emerald-400/15 text-emerald-200 border border-emerald-300/20',
  cerrada: 'bg-slate-400/15 text-slate-200 border border-slate-300/20',
  activo: 'bg-emerald-400/15 text-emerald-200 border border-emerald-300/20',
  inactivo: 'bg-rose-400/15 text-rose-200 border border-rose-300/20'
};

export function StatusBadge({ label }: { label: Status | string }) {
  const key = label as keyof typeof classes;
  const className = classes[key] ?? 'bg-slate-400/15 text-slate-300 border border-white/10';
  return <span className={`badge ${className}`}>{String(label).replace(/_/g, ' ')}</span>;
}
