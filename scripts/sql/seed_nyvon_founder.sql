-- Optional: seed or re-seed the NYVON Founder/Owner after migration.
-- Replace the email if your founder auth email differs.
-- Run in Supabase SQL Editor.

insert into public.platform_founders (user_id, note)
select id, 'NYVON Founder/Owner'
from auth.users
where lower(email) = lower('watch9collector@gmail.com')
on conflict (user_id) do nothing;

select user_id, note, created_at
from public.platform_founders;
