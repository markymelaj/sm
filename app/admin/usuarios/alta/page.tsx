import Link from 'next/link';

import { CreateUserForm } from '@/components/admin/create-user-form';
import { requireRole } from '@/lib/auth';

export default async function AdminAltaUsuariosPage() {
  await requireRole(['admin']);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-3">
        <Link className="btn btn-secondary" href="/admin/usuarios">Volver a usuarios internos</Link>
        <Link className="btn btn-secondary" href="/admin/clientes">Ver clientes</Link>
      </div>
      <CreateUserForm />
    </div>
  );
}
