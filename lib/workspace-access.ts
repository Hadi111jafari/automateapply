import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSupabaseServerComponentClient } from '@/lib/supabase/server';

export async function requireWorkspaceAccess() {
  const store = await cookies();
  if (store.get('automateapply-demo')?.value === '1') return { demo: true } as const;
  const supabase = await getSupabaseServerComponentClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) redirect('/login');
  return { demo: false, user: data.user } as const;
}
