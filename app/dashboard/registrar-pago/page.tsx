import { RegisterPaymentForm } from '@/components/dashboard/register-payment-form';
import { requireRole } from '@/lib/auth';

export default async function RegisterPaymentPage() {
  await requireRole(['cliente']);

  return (
    <div className="grid gap-6">
      <RegisterPaymentForm />
      <section className="card p-5">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">Qué haremos con tu pago</p>
        <div className="mt-3 grid gap-3 text-sm text-slate-200">
          <p>1. Lo recibimos con tu comprobante.</p>
          <p>2. Lo revisamos internamente.</p>
          <p>3. Cuando quede aprobado, aparecerá como pagado en tu portal.</p>
        </div>
      </section>
    </div>
  );
}
