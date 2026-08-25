import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function requireUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const supabase = getSupabaseServerClient(token);
  if (!supabase || !token) return { error: 'Supabase is not configured or you are not signed in.' } as const;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { error: 'Unauthorized.' } as const;
  return { supabase, user: data.user } as const;
}
