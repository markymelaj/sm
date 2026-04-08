import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/types';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';

export function createAdminClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
