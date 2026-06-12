-- LinkUp investor demo polish (run in Supabase SQL Editor)
-- Safe to re-run: updates legacy founder/demo rows only.

-- Professional demo LinkUp (replaces "Sunset run" style events)
update public.linkups
set
  title = 'Coffee & Entrepreneurs',
  category = 'Networking',
  location = 'La Junta Coffee Company',
  description = 'Meet local entrepreneurs, founders, and professionals for coffee and conversation.'
where lower(trim(title)) like '%sunset run%';

-- Founder profile bio (auth metadata)
update auth.users
set raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb),
  '{bio}',
  '"Founder & CEO of LinkUp"'::jsonb,
  true
)
where coalesce(raw_user_meta_data->>'bio', '') ilike '%developer of linkup%';

select pg_notify('pgrst', 'reload schema');
