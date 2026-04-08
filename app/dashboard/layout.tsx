export const dynamic = 'force-dynamic';

import { AppHeader } from '@/components/app-header';
import { requireRole } from '@/lib/auth';

const links = [
  { href: '/dashboard', label: 'Mi panel' }
];

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await requireRole(['cliente']);

  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} title={profile.nombre_completo} subtitle="Portal del cliente" links={links} />
      <main className="container-shell py-6 sm:py-8">{children}</main>
    </div>
  );
}
