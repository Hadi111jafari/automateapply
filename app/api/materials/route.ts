import { z } from 'zod';
import { requireUser } from '@/lib/api-auth';

const schema = z.object({ id: z.string().uuid().optional(), resumeId: z.string().uuid(), applicationId: z.string().uuid().nullable().optional(), tailoredResume: z.string().trim().min(1).max(100_000), coverLetter: z.string().trim().min(1).max(30_000), note: z.string().trim().max(2_000).default('') });

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return Response.json(auth, { status: 401 });
  const { data, error } = await auth.supabase.from('tailored_materials').select('*').order('updated_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ materials: data });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return Response.json(auth, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid materials.' }, { status: 400 });
  const input = parsed.data;
  const row = { user_id: auth.user.id, resume_id: input.resumeId, application_id: input.applicationId ?? null, tailored_resume: input.tailoredResume, cover_letter: input.coverLetter, note: input.note, updated_at: new Date().toISOString() };
  const query = input.id ? auth.supabase.from('tailored_materials').update(row).eq('id', input.id) : auth.supabase.from('tailored_materials').insert(row);
  const { data, error } = await query.select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ material: data }, { status: input.id ? 200 : 201 });
}
