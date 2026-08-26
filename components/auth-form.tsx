'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { endDemoMode, startDemoMode } from '@/lib/demo-mode';
import { describeAuthError } from '@/lib/auth-errors';
export function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<{ message: string; transient: boolean }>();
  const [notice, setNotice] = useState<string>();
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setNotice(undefined);
    setPending(true);
    try {
      const data = new FormData(event.currentTarget);
      const credentials = {
        email: String(data.get('email')),
        password: String(data.get('password')),
      };
      const endpoint =
        mode === 'signin' ? '/api/auth/signin' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPending(false);
        // The API already maps known causes, but map again here so nothing
        // raw can slip through (own fetch failure, proxy error pages, …).
        const view = describeAuthError(payload?.error);
        setError({ message: view.message, transient: view.kind === 'transient' || view.kind === 'rate-limit' });
        return;
      }
      // For signups that require email confirmation `payload.session` may be
      // null — keep demo mode active in that case.
      if (mode === 'signin' || payload?.session) await endDemoMode();
      if (mode === 'signup' && !payload.session) {
        setPending(false);
        setNotice('Check your inbox to confirm your email, then sign in.');
        return;
      }
      // Stay on “Please wait…” until /dashboard finishes loading; the
      // navigation itself unmounts this form. replace() already fetches a
      // fresh render with the new session cookies, so no extra refresh.
      router.replace('/dashboard');
    } catch {
      setPending(false);
      setError({
        message:
          "We couldn't reach the sign-in service just now. Check your connection and try again.",
        transient: true,
      });
    }
  }
  return (
    <form onSubmit={submit} className="panel mx-auto w-full max-w-md p-7">
      <p className="eyebrow">Welcome back</p>
      <h1 className="display mt-4 text-4xl font-bold">
        Let&apos;s get to work.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === 'signin'
          ? 'Sign in to your AutomateApply workspace.'
          : 'Create your AutomateApply workspace.'}
      </p>
      <label className="mt-7 block text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          placeholder="sarah@example.com"
          className="mt-2 h-11 w-full rounded-xl border border-border bg-[#171512] px-3 outline-none focus:border-[#e68b18]"
        />
      </label>
      <label className="mt-4 block text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="••••••••"
          className="mt-2 h-11 w-full rounded-xl border border-border bg-[#171512] px-3 outline-none focus:border-[#e68b18]"
        />
      </label>
      {error && (
        <p
          role="alert"
          className={`mt-3 text-sm ${
            // Red means "you can fix this input"; amber means "retry shortly".
            error.transient ? 'text-amber-300' : 'text-red-400'
          }`}
        >
          {error.message}
        </p>
      )}
      {notice && <p className="mt-3 text-sm text-green-400">{notice}</p>}
      <button
        disabled={pending}
        className="amber-button mt-6 w-full py-3 text-sm disabled:opacity-60"
      >
        {pending
          ? 'Please wait…'
          : mode === 'signin'
            ? 'Sign in'
            : 'Create account'}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setError(undefined);
          setNotice(undefined);
        }}
        className="mt-5 w-full text-center text-xs text-[#e89438]"
      >
        {mode === 'signin'
          ? 'Need an account? Sign up'
          : 'Already have an account? Sign in'}
      </button>
      <button
        type="button"
        onClick={() => {
          void startDemoMode().then(() => router.replace('/dashboard'));
        }}
        className="ghost-button mt-3 w-full py-2 text-xs"
      >
        Try Demo Account
      </button>
    </form>
  );
}
