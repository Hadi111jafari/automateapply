import { cookies } from 'next/headers';

export async function POST() {
  const store = await cookies();
  // This only selects public sample content; it grants no Supabase/data access.
  // It is readable by the UI so client components can render Sarah's local demo.
  store.set('automateapply-demo', '1', { httpOnly: false, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8, secure: process.env.NODE_ENV === 'production' });
  return Response.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete('automateapply-demo');
  return Response.json({ ok: true });
}
