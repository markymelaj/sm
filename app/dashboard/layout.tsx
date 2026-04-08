export const dynamic = 'force-dynamic';

import { AppHeader } from '@/components/app-header';
import { requireRole } from '@/lib/auth';

const links: Array<{ href: string; label: string }> = [];

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await requireRole(['cliente']);

  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} title="Bienvenido" subtitle={`Titular: ${profile.nombre_completo}`} links={links} />
      <main className="container-shell py-6 sm:py-8">{children}</main>
    </div>
  );
}
