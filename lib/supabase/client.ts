import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/types';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey()
  );

  return browserClient;
}
