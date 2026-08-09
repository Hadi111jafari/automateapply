'use client';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, type LoginState } from '@/app/login/actions';
const initial: LoginState = {};
export function AuthForm() {
  const [state, action, pending] = useActionState(login, initial);
  const router = useRouter();
  useEffect(() => {
    if (state.success) router.push('/dashboard');
  }, [state.success, router]);
  return (
    <form action={action} className="panel mx-auto w-full max-w-md p-7">
      <p className="eyebrow">Welcome back</p>
      <h1 className="display mt-4 text-4xl font-bold">
        Let&apos;s get to work.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to your AutomateApply workspace.
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
      {state.error && (
        <p className="mt-3 text-sm text-red-400">{state.error}</p>
      )}
      <button
        disabled={pending}
        className="amber-button mt-6 w-full py-3 text-sm disabled:opacity-60"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Demo mode: use any valid email and 8+ character password.
      </p>
    </form>
  );
}
