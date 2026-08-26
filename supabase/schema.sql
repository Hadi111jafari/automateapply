-- Run in the Supabase SQL editor after connecting the Supabase MCP server.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    full_name text not null default '',
    headline text not null default '',
    phone text not null default '',
    linkedin text not null default '',
    current_employer text not null default '',
    target_roles text [] not null default '{}',
    locations text [] not null default '{}',
    minimum_salary integer,
    auto_apply_threshold integer not null default 90 check (
        auto_apply_threshold between 0 and 100
    ),
    stealth boolean not null default true,
    anonymous_applications boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists email text;
create table if not exists public.resumes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    content text not null,
    file_path text,
    created_at timestamptz not null default now()
);
create table if not exists public.applications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    source_id text not null,
    source_url text not null,
    company text not null,
    title text not null,
    location text not null default 'Remote',
    match_score integer not null check (
        match_score between 0 and 100
    ),
    stage text not null default 'review' check (
        stage in (
            'review',
            'applied',
            'screen',
            'technical',
            'final',
            'offer',
            'rejected'
        )
    ),
    notes text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(user_id, source_id)
);
alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.applications enable row level security;
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own resumes" on public.resumes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own applications" on public.applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false) on conflict (id) do nothing;
create policy "resume files are private" on storage.objects for all using (
    bucket_id = 'resumes'
    and (storage.foldername(name)) [1] = auth.uid()::text
) with check (
    bucket_id = 'resumes'
    and (storage.foldername(name)) [1] = auth.uid()::text
);

-- Auth owns account creation; this copies only safe identity data into the app profile.
create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_profile_for_new_user();
