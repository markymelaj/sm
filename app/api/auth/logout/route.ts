import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(nextCookies: CookieToSet[]) {
          nextCookies.forEach((cookie) => cookiesToSet.push(withRootPath(cookie)));
        }
      }
    }
  );

  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL('/login', request.url), { status: 303 });
  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
