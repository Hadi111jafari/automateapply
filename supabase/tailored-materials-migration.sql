-- Run once in Supabase SQL Editor before testing AI tailoring.
create table if not exists public.tailored_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  application_id uuid references public.applications(id) on delete
  set null,
    tailored_resume text not null,
    cover_letter text not null,
    note text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
alter table public.tailored_materials enable row level security;
create policy "own tailored materials" on public.tailored_materials for all using (auth.uid() = user_id) with check (auth.uid() = user_id);