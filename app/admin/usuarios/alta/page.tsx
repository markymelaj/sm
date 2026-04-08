import { CreateUserForm } from '@/components/admin/create-user-form';
import { requireRole } from '@/lib/auth';

export default async function AdminAltaUsuarioPage() {
  await requireRole(['admin']);

  return <CreateUserForm />;
}
