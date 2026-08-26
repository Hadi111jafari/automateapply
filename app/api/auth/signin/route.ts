import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { describeAuthError } from '@/lib/auth-errors';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body ?? {};
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    return Response.json({ error: 'Supabase not configured' }, { status: 500 });
  const store = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          store.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    // Raw provider messages ("fetch failed", RLS/SQL details) stay in the
    // server log; users only ever see the mapped, actionable copy.
    console.warn('[auth/signin] rejected:', error.message);
    const view = describeAuthError(error.message);
    const retryable =
      view.kind === 'transient' || isAuthRetryableFetchError(error);
    return Response.json({ error: view.message, kind: view.kind }, { status: retryable ? 503 : 400 });
  }
  return Response.json({ user: data.user, session: data.session });
}
