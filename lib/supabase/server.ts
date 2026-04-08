import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/lib/types';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env';

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<Awaited<ReturnType<typeof cookies>>['set']>[2];
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components de solo lectura.
        }
      }
    }
  });
}
