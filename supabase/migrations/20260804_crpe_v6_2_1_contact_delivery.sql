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
  add column if not exists confirmation_error_code text null,
  add column if not exists confirmation_sent_at timestamptz null;

update public.contact_messages
set
  recipient_status = case
    when status = 'sent' then 'accepted'
    when status = 'failed' then 'failed'
    else recipient_status
  end,
  recipient_provider_message_id = coalesce(recipient_provider_message_id, provider_message_id)
where recipient_provider_message_id is null
   or recipient_status = 'pending';

grant select, insert, update on table public.contact_messages to service_role;

commit;

select
  case when has_column_privilege('service_role', 'public.contact_messages', 'recipient_status', 'UPDATE') then 'OK' else 'BŁĄD' end as status_odbiorcy,
  case when has_column_privilege('service_role', 'public.contact_messages', 'recipient_provider_message_id', 'UPDATE') then 'OK' else 'BŁĄD' end as id_odbiorcy,
  case when has_column_privilege('service_role', 'public.contact_messages', 'confirmation_status', 'UPDATE') then 'OK' else 'BŁĄD' end as status_potwierdzenia,
  case when has_column_privilege('service_role', 'public.contact_messages', 'confirmation_provider_message_id', 'UPDATE') then 'OK' else 'BŁĄD' end as id_potwierdzenia;

-- Diagnostyka ostatnich zgłoszeń bez ujawniania treści i adresu zgłaszającego.
select
  created_at,
  role,
  recipient,
  status,
  recipient_status,
  confirmation_status,
  provider_message_id is not null as brevo_przyjelo_do_crpe,
  confirmation_provider_message_id is not null as brevo_przyjelo_potwierdzenie,
  error_code,
  confirmation_error_code
from public.contact_messages
order by created_at desc
limit 10;
