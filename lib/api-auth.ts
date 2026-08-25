import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Shared across requests so the JWKS used to verify tokens locally is
// fetched once per server process instead of on every API call.
let claimsVerifier: ReturnType<typeof createClient> | null = null;
function getClaimsVerifier() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  claimsVerifier ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return claimsVerifier;
}

export async function requireUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const supabase = getSupabaseServerClient(token);
  const verifier = getClaimsVerifier();
  if (!supabase || !verifier || !token)
    return { error: 'Supabase is not configured or you are not signed in.' } as const;
  // Verifies the JWT signature locally when the project uses asymmetric
  // signing keys; falls back to an auth-server check for legacy secrets.
  const { data, error } = await verifier.auth.getClaims(token);
  const userId = data?.claims.sub;
  if (error || !userId) return { error: 'Unauthorized.' } as const;
  return {
    supabase,
    user: {
      id: userId,
      email: typeof data.claims.email === 'string' ? data.claims.email : null,
    },
  } as const;
}
