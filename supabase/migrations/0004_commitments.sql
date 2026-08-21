create table if not exists public.class_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  use_on date not null,
  followed_up boolean not null default false,
  outcome text,
  created_at timestamptz not null default now()
);

alter table public.class_commitments enable row level security;
create policy "own_commitments" on public.class_commitments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
