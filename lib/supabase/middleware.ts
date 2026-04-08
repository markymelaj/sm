import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import type { Database } from '@/lib/types';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env';

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

function withRootPath(cookie: CookieToSet): CookieToSet {
  return {
    ...cookie,
    options: {
      ...(cookie.options ?? {}),
      path: '/'
    }
  };
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          const rootCookies = cookiesToSet.map(withRootPath);

          rootCookies.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request: { headers: request.headers } });

          rootCookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  await supabase.auth.getUser();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
