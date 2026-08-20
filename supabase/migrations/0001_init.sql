-- SahajAiVidya — initial schema
-- profiles (1:1 with auth.users), survey_responses, progress,
-- playground_sessions, events. Row Level Security: users see only their own rows.

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text,
  subject text,
  grade_band text,
  confidence_using int,
  confidence_trust int,
  attitude text,
  reminder_time text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phase text not null check (phase in ('pre','post')),
  using_score int not null,
  trust_score int not null,
  attitude text not null,
  created_at timestamptz not null default now()
);

create table public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  status text not null default 'locked' check (status in ('locked','active','completed')),
  score int,
  attempts int not null default 0,
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);

create table public.playground_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text,
  artifact_type text,
  prompt text not null,
  output text not null,
  saved_to_toolkit boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  props jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.survey_responses enable row level security;
alter table public.progress enable row level security;
alter table public.playground_sessions enable row level security;
alter table public.events enable row level security;

create policy "own_profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_surveys" on public.survey_responses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_progress" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_playground" on public.playground_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_events" on public.events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
