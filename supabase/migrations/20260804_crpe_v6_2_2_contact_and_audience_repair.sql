-- CRPE v6.2.2
-- Naprawa diagnostyki formularza kontaktowego i praw do moderacji adresatów.
-- Skrypt jest idempotentny i można go uruchomić po migracji v6.2 lub v6.2.1.

begin;

alter table public.contact_messages
  drop constraint if exists contact_messages_status_check;

alter table public.contact_messages
  add constraint contact_messages_status_check
  check (status in ('pending', 'sent', 'partial', 'failed'));

alter table public.contact_messages
  add column if not exists recipient_status text not null default 'pending'
    check (recipient_status in ('pending', 'accepted', 'failed')),
  add column if not exists recipient_provider_message_id text null,
  add column if not exists confirmation_status text not null default 'not_attempted'
    check (confirmation_status in ('not_attempted', 'accepted', 'failed')),
  add column if not exists confirmation_provider_message_id text null,
  add column if not exists confirmation_sent_at timestamptz null,
  add column if not exists confirmation_error_code text null;

grant usage on schema public to service_role;
grant select, insert, update on table public.contact_messages to service_role;
grant select on table public.trainings to service_role;
grant update (target_profession_text) on table public.trainings to service_role;

-- Administrator działa jako authenticated, a RLS nadal wymaga jego roli.
grant select, update on table public.trainings to authenticated;

commit;

select
  case when has_table_privilege('service_role', 'public.contact_messages', 'SELECT') then 'OK' else 'BŁĄD' end as kontakt_select,
  case when has_table_privilege('service_role', 'public.contact_messages', 'INSERT') then 'OK' else 'BŁĄD' end as kontakt_insert,
  case when has_table_privilege('service_role', 'public.contact_messages', 'UPDATE') then 'OK' else 'BŁĄD' end as kontakt_update,
  case when has_column_privilege('authenticated', 'public.trainings', 'target_profession_text', 'UPDATE') then 'OK' else 'BŁĄD' end as adresaci_update;

