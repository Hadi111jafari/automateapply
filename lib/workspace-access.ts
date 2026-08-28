import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { getSupabaseServerComponentClient } from '@/lib/supabase/server';

// The proxy (proxy.ts) validates the session once and forwards the verified
// user id on this header; reading it here avoids a second Supabase round
// trip on every workspace navigation. Forged values are impossible because
// the proxy strips any incoming copy before setting its own.
export async function requireWorkspaceAccess() {
  const store = await cookies();
  if (store.get('automateapply-demo')?.value === '1') return { demo: true } as const;
  const userId = (await headers()).get('x-automateapply-user');
  if (!userId) redirect('/login');
  const supabase = await getSupabaseServerComponentClient();
  let onboardingCompleted = false;
  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .maybeSingle();
    onboardingCompleted = data?.onboarding_completed ?? false;
  }
  return { demo: false, user: { id: userId }, onboardingCompleted } as const;
}
