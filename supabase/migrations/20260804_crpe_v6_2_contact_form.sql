begin;

create extension if not exists pgcrypto;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('medyk', 'placowka', 'organizator')),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 320),
  organisation text null check (organisation is null or char_length(organisation) <= 180),
  scale text null check (scale is null or char_length(scale) <= 120),
  message text not null check (char_length(message) between 10 and 5000),
  recipient text not null,
  sender_hash text not null check (char_length(sender_hash) = 64),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  provider_message_id text null,
  error_code text null,
  sent_at timestamptz null,
  created_at timestamptz not null default now()
);

comment on table public.contact_messages is
  'Wiadomości z publicznego formularza CRPE; dostęp wyłącznie dla backendu service_role.';

create index if not exists contact_messages_sender_created_idx
  on public.contact_messages (sender_hash, created_at desc);

create index if not exists contact_messages_status_created_idx
  on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;

revoke all on table public.contact_messages from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update on table public.contact_messages to service_role;

commit;

select
  case when to_regclass('public.contact_messages') is not null then 'OK' else 'BŁĄD' end as tabela,
  case when has_table_privilege('service_role', 'public.contact_messages', 'SELECT') then 'OK' else 'BŁĄD' end as service_select,
  case when has_table_privilege('service_role', 'public.contact_messages', 'INSERT') then 'OK' else 'BŁĄD' end as service_insert,
  case when has_table_privilege('service_role', 'public.contact_messages', 'UPDATE') then 'OK' else 'BŁĄD' end as service_update,
  case when not has_table_privilege('anon', 'public.contact_messages', 'SELECT') then 'OK' else 'BŁĄD' end as anon_brak_odczytu;
