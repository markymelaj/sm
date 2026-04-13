import { CsvImportTool } from '@/components/admin/csv-import-tool';
import { requireRole } from '@/lib/auth';

export default async function AdminImportarBasePage() {
  await requireRole(['admin']);

  return <CsvImportTool />;
}
