export const dynamic = 'force-dynamic';

import { RequestAccessForm } from '@/components/access/request-access-form';

export default function RequestAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <RequestAccessForm />
      </div>
    </main>
  );
}
