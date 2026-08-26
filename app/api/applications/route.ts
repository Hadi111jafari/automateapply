import { z } from 'zod';
import { requireUser } from '@/lib/api-auth';

const createSchema = z.object({ sourceId: z.string().min(1), sourceUrl: z.string().url(), company: z.string().min(1), title: z.string().min(1), score: z.number().int().min(0).max(100), location: z.string().default('Remote'), notes: z.string().trim().max(2_000).default('') });
const patchSchema = z.object({ id: z.string().uuid(), stage: z.enum(['review', 'applied', 'screen', 'technical', 'final', 'offer', 'rejected']) });

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return Response.json(auth, { status: 401 });
  const { data, error } = await auth.supabase.from('applications').select('*').order('updated_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ applications: data });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return Response.json(auth, { status: 401 });
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: 'Invalid job.' }, { status: 400 });
  const row = { user_id: auth.user.id, source_id: parsed.data.sourceId, source_url: parsed.data.sourceUrl, company: parsed.data.company, title: parsed.data.title, match_score: parsed.data.score, location: parsed.data.location, notes: parsed.data.notes, stage: 'review' };
  const { data, error } = await auth.supabase.from('applications').upsert(row, { onConflict: 'user_id,source_id' }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ application: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return Response.json(auth, { status: 401 });
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: 'Invalid update.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('applications').update({ stage: parsed.data.stage, updated_at: new Date().toISOString() }).eq('id', parsed.data.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ application: data });
}
