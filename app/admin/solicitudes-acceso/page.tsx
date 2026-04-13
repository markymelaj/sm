import { AccessRequestsBoard } from '@/components/admin/access-requests-board';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminAccessRequestsPage() {
  await requireRole(['admin']);

  const admin: any = createAdminClient();
  const { data } = await admin
    .from('solicitudes_acceso')
    .select('*')
    .order('created_at', { ascending: false });

  const requests: any[] = data ?? [];

  return <AccessRequestsBoard initialRequests={requests} />;
}
