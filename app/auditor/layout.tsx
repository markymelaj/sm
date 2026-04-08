export const dynamic = 'force-dynamic';

import { AppHeader } from '@/components/app-header';
import { requireRole } from '@/lib/auth';

const links = [
  { href: '/auditor', label: 'Resumen' },
  { href: '/auditor/clientes', label: 'Clientes' },
  { href: '/auditor/pagos', label: 'Pagos' },
  { href: '/auditor/solicitudes', label: 'Solicitudes' }
];

export default async function AuditorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await requireRole(['auditor']);

  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} title="Panel auditor" subtitle="Revisión operativa y respuestas" links={links} />
      <main className="container-shell py-6 sm:py-8">{children}</main>
    </div>
  );
}
