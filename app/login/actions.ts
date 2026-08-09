'use server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginState = { error?: string; success?: boolean };
export async function login(
  _: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: true }; // Local demo mode keeps the MVP usable without credentials.
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  return error ? { error: error.message } : { success: true };
}
