create table if not exists public.notify_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, node_id)
);

alter table public.notify_requests enable row level security;
create policy "own_notify" on public.notify_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
