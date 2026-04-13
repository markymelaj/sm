export const dynamic = 'force-dynamic';

import { AppHeader } from '@/components/app-header';
import { requireRole } from '@/lib/auth';

const links = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/usuarios', label: 'Usuarios internos' },
  { href: '/admin/usuarios/alta', label: 'Alta de usuario' },
  { href: '/admin/pagos', label: 'Pagos' },
  { href: '/admin/importar-base', label: 'Importar base' },
  { href: '/admin/cuotas-masivas', label: 'Cuotas masivas' },
  { href: '/admin/solicitudes', label: 'Solicitudes' },
  { href: '/admin/avances', label: 'Avances' },
  { href: '/admin/configuracion', label: 'Configuración' }
];

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await requireRole(['admin']);

  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} title="Panel administrador" subtitle="Operación total del portal" links={links} />
      <main className="container-shell py-6 sm:py-8">{children}</main>
    </div>
  );
}
