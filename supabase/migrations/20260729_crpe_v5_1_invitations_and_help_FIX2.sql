-- CRPE v5.1 FIX2 / Supabase Frankfurt
-- POPRAWNA WERSJA: funkcja prepare_organization_invitation_resend
-- pobiera rekord zaproszenia i nazwę placówki w dwóch osobnych SELECT ... INTO.
-- Jeżeli niżej widzisz "into v_invitation, v_organization_name",
-- używasz starego, wadliwego pliku i nie należy go uruchamiać.
--
-- Systemowe zaproszenia placówki: stan wysyłki, wejście w link,
-- zalogowanie, ponowienie, anulowanie i pełny rejestr dla administratora.
--
-- Skrypt zakłada wykonaną migrację v5. Nie zmienia aktywności, cykli CPD,
-- dokumentów ani istniejących członkostw.

begin;

alter table public.organization_invitations
    add column if not exists delivery_status text not null default 'not_sent',
    add column if not exists send_attempts integer not null default 0,
    add column if not exists provider_message_id text,
    add column if not exists last_sent_at timestamptz,
    add column if not exists last_send_error text,
    add column if not exists opened_at timestamptz,
    add column if not exists authenticated_at timestamptz;

alter table public.organization_invitations
    drop constraint if exists organization_invitations_delivery_status_check;
alter table public.organization_invitations
    add constraint organization_invitations_delivery_status_check
    check (delivery_status in ('not_sent', 'sent', 'failed'));

alter table public.organization_invitations
    drop constraint if exists organization_invitations_send_attempts_check;
alter table public.organization_invitations
    add constraint organization_invitations_send_attempts_check
    check (send_attempts >= 0);

create index if not exists organization_invitations_delivery_idx
    on public.organization_invitations
        (organization_id, delivery_status, invited_at desc);

create or replace function public.create_organization_invitation(
    p_organization_id uuid,
    p_email text,
    p_role_code text default 'member',
    p_unit_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_user_id uuid := (select auth.uid());
    v_email text := lower(btrim(coalesce(p_email, '')));
    v_invitation public.organization_invitations;
    v_organization_name text;
begin
    if v_email = ''
       or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
       or char_length(v_email) > 320 then
        raise exception 'Podaj poprawny adres e-mail.';
    end if;

    if p_role_code not in ('admin', 'coordinator', 'reviewer', 'report_viewer', 'member') then
        raise exception 'Ta rola nie może zostać nadana w zaproszeniu.';
    end if;

    if not public.has_organization_permission(
        p_organization_id, 'invitations.manage', p_unit_id
    ) then
        raise exception 'Brak uprawnienia do zapraszania osób.'
            using errcode = '42501';
    end if;

    if p_role_code = 'admin'
       and not public.has_organization_permission(
           p_organization_id, 'owner.manage', null
       ) then
        raise exception 'Tylko właściciel może zaprosić administratora.'
            using errcode = '42501';
    end if;

    select o.display_name
      into v_organization_name
      from public.organizations o
     where o.id = p_organization_id
       and o.deleted_at is null;

    if v_organization_name is null then
        raise exception 'Placówka nie istnieje.';
    end if;

    if p_unit_id is not null then
        if p_role_code not in ('coordinator', 'reviewer', 'report_viewer') then
            raise exception 'W jednostce można nadać rolę koordynatora, weryfikatora lub odbiorcy raportów.';
        end if;
        if not exists (
            select 1
            from public.organization_units u
            where u.id = p_unit_id
              and u.organization_id = p_organization_id
              and u.deleted_at is null
        ) then
            raise exception 'Wybrana jednostka nie należy do tej placówki.';
        end if;
    end if;

    update public.organization_invitations
       set token = gen_random_uuid(),
           role_code = p_role_code,
           unit_id = p_unit_id,
           invited_by = v_user_id,
           invited_at = now(),
           expires_at = now() + interval '14 days',
           delivery_status = 'not_sent',
           provider_message_id = null,
           last_send_error = null,
           opened_at = null,
           authenticated_at = null
     where organization_id = p_organization_id
       and email_normalized = v_email
       and status = 'pending'
       and revoked_at is null
    returning * into v_invitation;

    if v_invitation.id is null then
        insert into public.organization_invitations (
            organization_id,
            email_normalized,
            role_code,
            unit_id,
            invited_by
        )
        values (
            p_organization_id,
            v_email,
            p_role_code,
            p_unit_id,
            v_user_id
        )
        returning * into v_invitation;
    end if;

    insert into public.organization_audit_events (
        organization_id, actor_user_id, event_code, target_type, target_id, details
    )
    values (
        p_organization_id,
        v_user_id,
        'invitation.created',
        'invitation',
        v_invitation.id::text,
        jsonb_build_object(
            'email', v_email,
            'role_code', p_role_code,
            'unit_id', p_unit_id
        )
    );

    return jsonb_build_object(
        'id', v_invitation.id,
        'token', v_invitation.token,
        'email', v_invitation.email_normalized,
        'role_code', v_invitation.role_code,
        'organization_name', v_organization_name,
        'expires_at', v_invitation.expires_at
    );
end
$function$;

create or replace function public.record_organization_invitation_send(
    p_invitation_id uuid,
    p_sent boolean,
    p_provider_message_id text default null,
    p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_user_id uuid := (select auth.uid());
    v_invitation public.organization_invitations;
begin
    select *
      into v_invitation
      from public.organization_invitations i
     where i.id = p_invitation_id;

    if v_invitation.id is null then
        raise exception 'Zaproszenie nie istnieje.';
    end if;

    if not public.has_organization_permission(
        v_invitation.organization_id, 'invitations.manage', v_invitation.unit_id
    ) then
        raise exception 'Brak uprawnienia do zarządzania zaproszeniem.'
            using errcode = '42501';
    end if;

    update public.organization_invitations
       set delivery_status = case when p_sent then 'sent' else 'failed' end,
           send_attempts = send_attempts + 1,
           provider_message_id = case
               when p_sent then nullif(btrim(coalesce(p_provider_message_id, '')), '')
               else null
           end,
           last_sent_at = case when p_sent then now() else last_sent_at end,
           last_send_error = case
               when p_sent then null
               else left(coalesce(nullif(btrim(p_error), ''), 'Nieznany błąd wysyłki.'), 500)
           end
     where id = p_invitation_id;

    insert into public.organization_audit_events (
        organization_id, actor_user_id, event_code, target_type, target_id, details
    )
    values (
        v_invitation.organization_id,
        v_user_id,
        case when p_sent then 'invitation.sent' else 'invitation.send_failed' end,
        'invitation',
        v_invitation.id::text,
        jsonb_build_object('email', v_invitation.email_normalized)
    );
end
$function$;

create or replace function public.prepare_organization_invitation_resend(
    p_invitation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_user_id uuid := (select auth.uid());
    v_invitation public.organization_invitations;
    v_organization_name text;
begin
    select i.*
      into v_invitation
      from public.organization_invitations i
      join public.organizations o on o.id = i.organization_id
     where i.id = p_invitation_id
       and o.deleted_at is null
     for update of i;

    if v_invitation.id is null then
        raise exception 'Zaproszenie nie istnieje.';
    end if;

    select o.display_name
      into v_organization_name
      from public.organizations o
     where o.id = v_invitation.organization_id
       and o.deleted_at is null;

    if v_invitation.status = 'accepted' then
        raise exception 'To zaproszenie zostało już przyjęte.';
    end if;

    if v_invitation.status = 'revoked' or v_invitation.revoked_at is not null then
        raise exception 'Anulowanego zaproszenia nie można ponowić.';
    end if;

    if not public.has_organization_permission(
        v_invitation.organization_id, 'invitations.manage', v_invitation.unit_id
    ) then
        raise exception 'Brak uprawnienia do ponowienia zaproszenia.'
            using errcode = '42501';
    end if;

    update public.organization_invitations
       set token = gen_random_uuid(),
           status = 'pending',
           invited_by = v_user_id,
           invited_at = now(),
           expires_at = now() + interval '14 days',
           delivery_status = 'not_sent',
           provider_message_id = null,
           last_send_error = null,
           opened_at = null,
           authenticated_at = null
     where id = p_invitation_id
    returning * into v_invitation;

    insert into public.organization_audit_events (
        organization_id, actor_user_id, event_code, target_type, target_id, details
    )
    values (
        v_invitation.organization_id,
        v_user_id,
        'invitation.resent',
        'invitation',
        v_invitation.id::text,
        jsonb_build_object('email', v_invitation.email_normalized)
    );

    return jsonb_build_object(
        'id', v_invitation.id,
        'token', v_invitation.token,
        'email', v_invitation.email_normalized,
        'role_code', v_invitation.role_code,
        'organization_name', v_organization_name,
        'expires_at', v_invitation.expires_at
    );
end
$function$;

create or replace function public.cancel_organization_invitation(
    p_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_user_id uuid := (select auth.uid());
    v_invitation public.organization_invitations;
begin
    select *
      into v_invitation
      from public.organization_invitations i
     where i.id = p_invitation_id
     for update;

    if v_invitation.id is null then
        raise exception 'Zaproszenie nie istnieje.';
    end if;

    if not public.has_organization_permission(
        v_invitation.organization_id, 'invitations.manage', v_invitation.unit_id
    ) then
        raise exception 'Brak uprawnienia do anulowania zaproszenia.'
            using errcode = '42501';
    end if;

    if v_invitation.status = 'accepted' then
        raise exception 'Przyjętego zaproszenia nie można anulować. Zmień dostęp pracownika.';
    end if;

    update public.organization_invitations
       set status = 'revoked',
           revoked_at = now()
     where id = p_invitation_id;

    insert into public.organization_audit_events (
        organization_id, actor_user_id, event_code, target_type, target_id, details
    )
    values (
        v_invitation.organization_id,
        v_user_id,
        'invitation.revoked',
        'invitation',
        v_invitation.id::text,
        jsonb_build_object('email', v_invitation.email_normalized)
    );
end
$function$;

create or replace function public.mark_organization_invitation_opened(
    p_token uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
    update public.organization_invitations
       set opened_at = coalesce(opened_at, now())
     where token = p_token
       and status = 'pending'
       and revoked_at is null
       and expires_at > now();
end
$function$;

create or replace function public.mark_organization_invitation_authenticated(
    p_token uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_auth_email text := lower(btrim(coalesce((select auth.jwt() ->> 'email'), '')));
begin
    if (select auth.uid()) is null then
        raise exception 'Zaloguj się, aby potwierdzić zaproszenie.'
            using errcode = '42501';
    end if;

    update public.organization_invitations
       set opened_at = coalesce(opened_at, now()),
           authenticated_at = coalesce(authenticated_at, now())
     where token = p_token
       and email_normalized = v_auth_email
       and status = 'pending'
       and revoked_at is null
       and expires_at > now();
end
$function$;

create or replace function public.get_organization_invitations(
    p_organization_id uuid
)
returns table (
    id uuid,
    email text,
    token uuid,
    role_code text,
    unit_id uuid,
    unit_name text,
    status text,
    delivery_status text,
    send_attempts integer,
    invited_at timestamptz,
    expires_at timestamptz,
    last_sent_at timestamptz,
    last_send_error text,
    opened_at timestamptz,
    authenticated_at timestamptz,
    accepted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $function$
    select
        i.id,
        i.email_normalized,
        i.token,
        i.role_code,
        i.unit_id,
        u.name,
        case
            when i.status = 'pending' and i.expires_at <= now() then 'expired'
            else i.status
        end,
        i.delivery_status,
        i.send_attempts,
        i.invited_at,
        i.expires_at,
        i.last_sent_at,
        i.last_send_error,
        i.opened_at,
        i.authenticated_at,
        i.accepted_at
    from public.organization_invitations i
    left join public.organization_units u on u.id = i.unit_id
    where i.organization_id = p_organization_id
      and public.has_organization_permission(
          i.organization_id, 'invitations.view', i.unit_id
      )
    order by i.invited_at desc;
$function$;

revoke all on function public.record_organization_invitation_send(uuid, boolean, text, text)
    from public;
revoke all on function public.prepare_organization_invitation_resend(uuid)
    from public;
revoke all on function public.cancel_organization_invitation(uuid)
    from public;
revoke all on function public.mark_organization_invitation_opened(uuid)
    from public;
revoke all on function public.mark_organization_invitation_authenticated(uuid)
    from public;
revoke all on function public.get_organization_invitations(uuid)
    from public;

grant execute on function public.record_organization_invitation_send(uuid, boolean, text, text)
    to authenticated;
grant execute on function public.prepare_organization_invitation_resend(uuid)
    to authenticated;
grant execute on function public.cancel_organization_invitation(uuid)
    to authenticated;
grant execute on function public.mark_organization_invitation_opened(uuid)
    to anon, authenticated;
grant execute on function public.mark_organization_invitation_authenticated(uuid)
    to authenticated;
grant execute on function public.get_organization_invitations(uuid)
    to authenticated;

commit;

-- Wynik kontrolny: wszystkie 10 wierszy powinno mieć wynik OK.
with tests(lp, test, oczekiwano, znaleziono) as (
    values
        (
            1,
            'Kolumny śledzenia zaproszenia',
            7::bigint,
            (
                select count(*)::bigint
                from information_schema.columns
                where table_schema = 'public'
                  and table_name = 'organization_invitations'
                  and column_name in (
                      'delivery_status', 'send_attempts', 'provider_message_id',
                      'last_sent_at', 'last_send_error', 'opened_at',
                      'authenticated_at'
                  )
            )
        ),
        (
            2,
            'Funkcje obsługi rejestru zaproszeń',
            6::bigint,
            (
                select count(*)::bigint
                from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public'
                  and p.proname in (
                      'record_organization_invitation_send',
                      'prepare_organization_invitation_resend',
                      'cancel_organization_invitation',
                      'mark_organization_invitation_opened',
                      'mark_organization_invitation_authenticated',
                      'get_organization_invitations'
                  )
            )
        ),
        (
            3,
            'Poprawne wartości stanu wysyłki',
            0::bigint,
            (
                select count(*)::bigint
                from public.organization_invitations
                where delivery_status not in ('not_sent', 'sent', 'failed')
            )
        ),
        (
            4,
            'Nieujemna liczba prób wysyłki',
            0::bigint,
            (
                select count(*)::bigint
                from public.organization_invitations
                where send_attempts < 0
            )
        ),
        (
            5,
            'Funkcja otwarcia dostępna anonimowo',
            1::bigint,
            (
                select count(*)::bigint
                where has_function_privilege(
                    'anon',
                    'public.mark_organization_invitation_opened(uuid)',
                    'EXECUTE'
                )
            )
        ),
        (
            6,
            'Rejestr dostępny dla zalogowanych',
            1::bigint,
            (
                select count(*)::bigint
                where has_function_privilege(
                    'authenticated',
                    'public.get_organization_invitations(uuid)',
                    'EXECUTE'
                )
            )
        ),
        (
            7,
            'Ponowienie dostępne dla zalogowanych',
            1::bigint,
            (
                select count(*)::bigint
                where has_function_privilege(
                    'authenticated',
                    'public.prepare_organization_invitation_resend(uuid)',
                    'EXECUTE'
                )
            )
        ),
        (
            8,
            'Anulowanie dostępne dla zalogowanych',
            1::bigint,
            (
                select count(*)::bigint
                where has_function_privilege(
                    'authenticated',
                    'public.cancel_organization_invitation(uuid)',
                    'EXECUTE'
                )
            )
        ),
        (
            9,
            'Brak zaakceptowanych zaproszeń bez daty akceptacji',
            0::bigint,
            (
                select count(*)::bigint
                from public.organization_invitations
                where status = 'accepted'
                  and accepted_at is null
            )
        ),
        (
            10,
            'Brak wysłanych zaproszeń bez próby wysyłki',
            0::bigint,
            (
                select count(*)::bigint
                from public.organization_invitations
                where delivery_status = 'sent'
                  and send_attempts = 0
            )
        )
)
select
    lp,
    test,
    oczekiwano,
    znaleziono,
    case when oczekiwano = znaleziono then 'OK' else 'BŁĄD' end as wynik
from tests
order by lp;
