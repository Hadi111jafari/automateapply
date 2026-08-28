import { z } from 'zod';
import { requireUser } from '@/lib/api-auth';

const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(100), headline: z.string().trim().max(160).default(''),
  phone: z.string().trim().max(40).default(''), linkedin: z.string().trim().max(200).default(''),
  currentEmployer: z.string().trim().max(100).default(''), targetRoles: z.array(z.string().trim().max(100)).max(10).default([]),
  locations: z.array(z.string().trim().max(100)).max(10).default([]), minimumSalary: z.number().int().min(0).nullable().default(null),
  autoApplyThreshold: z.number().int().min(0).max(100).default(90), stealth: z.boolean().default(true), anonymousApplications: z.boolean().default(false),
  onboardingCompleted: z.boolean().default(false),
});

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return Response.json(auth, { status: 401 });
  const { data, error } = await auth.supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (data) return Response.json({ profile: data });
  const fallbackName = auth.user.email?.split('@')[0] ?? 'New user';
  const { data: created, error: createError } = await auth.supabase
    .from('profiles')
    .upsert({ id: auth.user.id, email: auth.user.email ?? null, full_name: fallbackName, onboarding_completed: false })
    .select()
    .single();
  if (createError) return Response.json({ error: createError.message }, { status: 400 });
  return Response.json({ profile: created });
}

export async function PUT(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return Response.json(auth, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid profile.' }, { status: 400 });
  const profile = parsed.data;
  const { data, error } = await auth.supabase
    .from('profiles')
    .upsert({
      id: auth.user.id,
      email: auth.user.email ?? null,
      full_name: profile.fullName,
      headline: profile.headline,
      phone: profile.phone,
      linkedin: profile.linkedin,
      current_employer: profile.currentEmployer,
      target_roles: profile.targetRoles,
      locations: profile.locations,
      minimum_salary: profile.minimumSalary,
      auto_apply_threshold: profile.autoApplyThreshold,
      stealth: profile.stealth,
      anonymous_applications: profile.anonymousApplications,
      onboarding_completed: profile.onboardingCompleted,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ profile: data });
}
