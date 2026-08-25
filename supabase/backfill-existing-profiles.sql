-- Run once after profile-auth-migration.sql for users created before that trigger.
-- It creates only missing profile rows and does not overwrite saved profile details.
insert into public.profiles (id, email, full_name)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do update set email = excluded.email;
