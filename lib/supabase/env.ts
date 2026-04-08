export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL.');
  }

  return url;
}

export function getSupabasePublishableKey() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      'Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return key;
}

export function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY.');
  }

  return key;
}
