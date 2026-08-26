import { createClient } from "@supabase/supabase-js";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a request-scoped Supabase client. Never use the service-role key for
 * user requests: passing the access token lets RLS remain the authorization
 * boundary for every API route.
 */
export function getSupabaseServerClient(accessToken?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: accessToken
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : undefined,
      })
    : null;
}

/** Request-scoped browser-session client for Server Components and Server Actions. */
export async function getSupabaseServerComponentClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: () => {},
    },
  });
}
