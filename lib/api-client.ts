'use client';

import { toast } from 'sonner';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

function demoActive(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.localStorage.getItem('automateapply-demo-mode') === 'true' ||
    document.cookie.split('; ').includes('automateapply-demo=1')
  );
}

// Thrown when a protected API call runs without a valid Supabase session
// (expired or missing token). The demo workspace never calls the API, so this
// only ever reaches real accounts whose session has ended.
export class AuthRequiredError extends Error {
  constructor() {
    super('Your session has ended. Sign in to continue.');
    this.name = 'AuthRequiredError';
  }
}

export function isAuthRequiredError(cause: unknown): boolean {
  return cause instanceof AuthRequiredError;
}

// Maps any thrown value to the message a component should render, plus whether
// it is an auth error so the UI can stay calm instead of alarming red.
export function describeLoadError(cause: unknown): { message: string; auth: boolean } {
  if (cause instanceof AuthRequiredError) return { message: cause.message, auth: true };
  return {
    message: cause instanceof Error ? cause.message : 'Something went wrong. Please try again.',
    auth: false,
  };
}

let lastAuthToastAt = 0;

// One friendly toast per burst for every protected page, shown in a single
// place (here) instead of red "sign in" text scattered through the UI. The
// demo workspace suppresses it entirely.
function notifySessionExpired() {
  if (demoActive()) return;
  const now = Date.now();
  if (now - lastAuthToastAt < 8_000) return;
  lastAuthToastAt = now;
  toast('Session ended', {
    description: 'Please sign in again to keep your workspace up to date.',
  });
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error('Supabase is not configured. Add the public URL and publishable key to .env.local.');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    notifySessionExpired();
    throw new AuthRequiredError();
  }
  const response = await fetch(path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    if (response.status === 401) {
      notifySessionExpired();
      throw new AuthRequiredError();
    }
    throw new Error(body.error ?? 'Request failed.');
  }
  return body;
}
