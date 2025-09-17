-- Create a simple sessions table for production session storage
create table if not exists public.user_sessions (
  sid text primary key,
  sess jsonb not null,
  expire timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for efficient session cleanup
create index if not exists idx_user_sessions_expire on public.user_sessions(expire);

-- RLS policies (optional, for security)
alter table public.user_sessions enable row level security;

-- Allow the service role to manage all sessions
create policy "Service role can manage sessions" on public.user_sessions
  for all using (auth.role() = 'service_role');