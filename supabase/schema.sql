-- Apply in the Supabase SQL editor. Policies scope every row to the signed-in user.
create table if not exists public.jobs (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) not null, company text not null, title text not null, match_score integer check (match_score between 0 and 100), metadata jsonb default '{}'::jsonb, created_at timestamptz default now());
create table if not exists public.applications (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) not null, job_id uuid references public.jobs(id) on delete cascade, stage text not null default 'applied', notes text default '', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.resumes (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) not null, name text not null, content text not null, created_at timestamptz default now());
alter table public.jobs enable row level security; alter table public.applications enable row level security; alter table public.resumes enable row level security;
create policy "own jobs" on public.jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own applications" on public.applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own resumes" on public.resumes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
