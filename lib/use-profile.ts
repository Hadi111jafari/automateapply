'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useDemoMode } from '@/lib/demo-mode';

const profileChangedEvent = 'automateapply-profile-changed';

export type Profile = { full_name: string; email: string | null; headline: string; phone: string; linkedin: string; current_employer: string; target_roles: string[]; locations: string[]; minimum_salary: number | null; auto_apply_threshold: number; stealth: boolean; anonymous_applications: boolean };

export function useProfile() {
  const demoMode = useDemoMode();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(true);
  useEffect(() => {
    if (demoMode) return;
    let alive = true;
    const load = () => {
      void Promise.all([apiFetch<{ profile: Profile | null }>('/api/profile'), getSupabaseBrowserClient()?.auth.getUser()]).then(([result, auth]) => {
        if (!alive) return;
        setProfile(result.profile); setEmail(auth?.data.user?.email ?? result.profile?.email ?? '');
      }).catch(() => undefined).finally(() => { if (alive) setPending(false); });
    };
    load();
    window.addEventListener(profileChangedEvent, load);
    return () => { alive = false; window.removeEventListener(profileChangedEvent, load); };
  }, [demoMode]);
  const updateProfile = (next: Profile) => {
    setProfile(next);
    window.dispatchEvent(new Event(profileChangedEvent));
  };
  return { demoMode, profile, email, loading: !demoMode && pending, setProfile: updateProfile };
}
