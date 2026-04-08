import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

import type { Database } from '@/lib/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env';

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

type LoginProfile = Pick<
  Database['public']['Tables']['perfiles']['Row'],
  'id' | 'rol' | 'activo' | 'requiere_cambio_pass'
>;

function withRootPath(cookie: CookieToSet): CookieToSet {
  return {
    ...cookie,
    options: {
      ...(cookie.options ?? {}),
      path: '/'
    }
  };
}

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  cookiesToSet: CookieToSet[] = []
) {
  const response = NextResponse.redirect(new URL(pathname, request.url), { status: 303 });
  cookiesToSet.map(withRootPath).forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function GET(request: NextRequest) {
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

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('post-login: no user in SSR session', {
      message: userError?.message ?? null
    });
    await supabase.auth.signOut();
    return redirectWithCookies(request, '/login?error=session', cookiesToSet);
  }

  const admin = createAdminClient();

  const { data: authUserData, error: authUserError } = await admin.auth.admin.getUserById(user.id);
  if (authUserError || !authUserData?.user) {
    console.error('post-login: service role cannot read auth user', {
      userId: user.id,
      error: authUserError?.message ?? null,
      status: authUserError?.status ?? null,
      code: (authUserError as { code?: string } | null)?.code ?? null
    });
    await supabase.auth.signOut();
    return redirectWithCookies(request, '/login?error=service-role', cookiesToSet);
  }

  const { data: profileData, error: profileError } = await admin
    .from('perfiles')
    .select('id, rol, activo, requiere_cambio_pass')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('post-login: profile query failed', {
      userId: user.id,
      error: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code
    });
    await supabase.auth.signOut();
    return redirectWithCookies(request, '/login?error=profile-query', cookiesToSet);
  }

  const profile = (profileData ?? null) as LoginProfile | null;

  if (!profile) {
    console.error('post-login: profile missing for authenticated user', {
      userId: user.id,
      email: user.email ?? null
    });
    await supabase.auth.signOut();
    return redirectWithCookies(request, '/login?error=profile-missing', cookiesToSet);
  }

  if (!profile.activo) {
    await supabase.auth.signOut();
    return redirectWithCookies(request, '/login?inactive=1', cookiesToSet);
  }

  if (profile.requiere_cambio_pass) {
    return redirectWithCookies(request, '/cambiar-clave', cookiesToSet);
  }

  if (profile.rol === 'admin') {
    return redirectWithCookies(request, '/admin', cookiesToSet);
  }

  if (profile.rol === 'auditor') {
    return redirectWithCookies(request, '/auditor', cookiesToSet);
  }

  return redirectWithCookies(request, '/dashboard', cookiesToSet);
}
