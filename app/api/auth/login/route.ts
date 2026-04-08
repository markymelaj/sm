import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

import type { Database } from '@/lib/types';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env';
import { makeTechnicalEmail, normalizeIdentifier } from '@/lib/rut';

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

function redirectWithCookies(request: NextRequest, pathname: string, cookiesToSet: CookieToSet[] = []) {
  const response = NextResponse.redirect(new URL(pathname, request.url), { status: 303 });
  cookiesToSet.map(withRootPath).forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const rawIdentifier = String(formData.get('identifier') ?? '');
  const password = String(formData.get('password') ?? '');
  const normalizedIdentifier = normalizeIdentifier(rawIdentifier);

  if (!normalizedIdentifier || !password) {
    return redirectWithCookies(request, '/login?error=missing');
  }

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

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: makeTechnicalEmail(normalizedIdentifier),
    password
  });

  if (signInError) {
    return redirectWithCookies(request, '/login?error=invalid', cookiesToSet);
  }

  return redirectWithCookies(request, '/auth/post-login', cookiesToSet);
}
