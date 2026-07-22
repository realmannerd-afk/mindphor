create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  key_hash text not null,
  key_prefix text not null,
  name text,
  last_used_at timestamptz,
  revoked boolean default false,
  created_at timestamptz default now()
);
alter table api_keys enable row level security;
create policy "users manage own keys" on api_keys for all using (auth.uid() = user_id);

create table integration_webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  platform text not null check (platform in ('slack', 'discord', 'custom')),
  webhook_url text not null,
  secret text,
  enabled boolean default true,
  created_at timestamptz default now()
);
alter table integration_webhooks enable row level security;
create policy "users manage own webhooks" on integration_webhooks for all using (auth.uid() = user_id);
