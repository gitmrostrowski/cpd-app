-- CRPE v5.1e / kontekst placówki i bezpieczne przyjęcie zaproszenia
-- przez istniejące konto używające innego adresu e-mail.
-- Uruchomić jeden raz po migracji v5.1c.

begin;

drop function if exists public.accept_organization_invitation(uuid);

create or replace function public.accept_organization_invitation(
    p_token uuid,
    p_accept_different_email boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_user_id uuid := (select auth.uid());
    v_auth_email text := lower(btrim(coalesce((select auth.jwt() ->> 'email'), '')));
    v_invitation public.organization_invitations;
    v_membership public.organization_memberships;
    v_email_matches boolean;
    v_invited_email_account_exists boolean := false;
begin
    if v_user_id is null or v_auth_email = '' then
        raise exception 'Zaloguj się, aby przyjąć zaproszenie.'
            using errcode = '42501';
    end if;

    select *
      into v_invitation
      from public.organization_invitations i
     where i.token = p_token
       and i.status = 'pending'
       and i.revoked_at is null
     for update;

    if v_invitation.id is null then
        raise exception 'Zaproszenie jest nieprawidłowe lub zostało już wykorzystane.';
    end if;

    if v_invitation.expires_at <= now() then
        update public.organization_invitations
           set status = 'expired'
         where id = v_invitation.id;
        raise exception 'Zaproszenie wygasło. Poproś administratora o nowe.';
    end if;

    v_email_matches := v_auth_email = v_invitation.email_normalized;

    if not v_email_matches then
        select exists (
            select 1
              from auth.users u
             where lower(btrim(coalesce(u.email, ''))) =
                   v_invitation.email_normalized
        )
          into v_invited_email_account_exists;

        if v_invited_email_account_exists then
            raise exception 'Dla zaproszonego adresu istnieje już osobne konto CRPE. Zaloguj się do tego konta.'
                using errcode = '42501';
        end if;

        if not coalesce(p_accept_different_email, false) then
            raise exception 'Potwierdź przypisanie zaproszenia do konta używającego innego adresu e-mail.'
                using errcode = '42501';
        end if;
    end if;

    insert into public.organization_memberships (
        organization_id,
        user_id,
        status,
        joined_at,
        ended_at,
        created_by
    )
    values (
        v_invitation.organization_id,
        v_user_id,
        'active',
        now(),
        null,
        v_invitation.invited_by
    )
    on conflict (organization_id, user_id)
    do update set
        status = 'active',
        joined_at = coalesce(public.organization_memberships.joined_at, now()),
        ended_at = null
    returning * into v_membership;

    insert into public.organization_membership_roles (
        membership_id, role_code, granted_by
    )
    values (v_membership.id, 'member', v_invitation.invited_by)
    on conflict (membership_id, role_code) do nothing;

    if v_invitation.unit_id is null and v_invitation.role_code <> 'member' then
        insert into public.organization_membership_roles (
            membership_id, role_code, granted_by
        )
        values (
            v_membership.id,
            v_invitation.role_code,
            v_invitation.invited_by
        )
        on conflict (membership_id, role_code) do nothing;
    end if;

    if v_invitation.unit_id is not null then
        insert into public.membership_unit_assignments (
            membership_id, unit_id, assigned_by
        )
        values (
            v_membership.id,
            v_invitation.unit_id,
            v_invitation.invited_by
        )
        on conflict (membership_id, unit_id) do nothing;

        insert into public.organization_unit_role_assignments (
            membership_id, unit_id, role_code, granted_by, revoked_at
        )
        values (
            v_membership.id,
            v_invitation.unit_id,
            v_invitation.role_code,
            v_invitation.invited_by,
            null
        )
        on conflict (membership_id, unit_id, role_code)
        do update set
            granted_by = excluded.granted_by,
            granted_at = now(),
            revoked_at = null;
    end if;

    update public.organization_invitations
       set status = 'accepted',
           accepted_by = v_user_id,
           accepted_at = now(),
           authenticated_at = coalesce(authenticated_at, now())
     where id = v_invitation.id;

    insert into public.organization_audit_events (
        organization_id, actor_user_id, event_code, target_type, target_id, details
    )
    values (
        v_invitation.organization_id,
        v_user_id,
        'invitation.accepted',
        'membership',
        v_membership.id::text,
        jsonb_build_object(
            'role_code', v_invitation.role_code,
            'unit_id', v_invitation.unit_id,
            'invitation_email_match', v_email_matches,
            'claim_mode',
                case
                    when v_email_matches then 'same_email'
                    else 'existing_account_different_email'
                end
        )
    );

    return jsonb_build_object(
        'organization_id', v_invitation.organization_id,
        'membership_id', v_membership.id,
        'invitation_email_match', v_email_matches
    );
end
$function$;

revoke all on function public.accept_organization_invitation(uuid, boolean)
    from public;
grant execute on function public.accept_organization_invitation(uuid, boolean)
    to authenticated;

create or replace function public.mark_organization_invitation_authenticated(
    p_token uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
    if (select auth.uid()) is null then
        raise exception 'Zaloguj się, aby potwierdzić zaproszenie.'
            using errcode = '42501';
    end if;

    update public.organization_invitations
       set opened_at = coalesce(opened_at, now()),
           authenticated_at = coalesce(authenticated_at, now())
     where token = p_token
       and status = 'pending'
       and revoked_at is null
       and expires_at > now();
end
$function$;

revoke all on function public.mark_organization_invitation_authenticated(uuid)
    from public;
grant execute on function public.mark_organization_invitation_authenticated(uuid)
    to authenticated;

commit;

-- Wynik kontrolny: wszystkie 10 wierszy powinno mieć wynik OK.
with tests(lp, test, oczekiwano, znaleziono) as (
    values
        (
            1,
            'Nowa funkcja przyjęcia zaproszenia istnieje',
            1::bigint,
            (
                select count(*)::bigint
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public'
                   and p.proname = 'accept_organization_invitation'
                   and pg_get_function_identity_arguments(p.oid) =
                       'p_token uuid, p_accept_different_email boolean'
            )
        ),
        (
            2,
            'Stara jednoargumentowa funkcja została usunięta',
            0::bigint,
            (
                select count(*)::bigint
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public'
                   and p.proname = 'accept_organization_invitation'
                   and pg_get_function_identity_arguments(p.oid) = 'p_token uuid'
            )
        ),
        (
            3,
            'Przyjęcie działa z prawami właściciela funkcji',
            1::bigint,
            (
                select count(*)::bigint
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public'
                   and p.proname = 'accept_organization_invitation'
                   and p.prosecdef
            )
        ),
        (
            4,
            'Tylko zalogowany użytkownik może przyjąć zaproszenie',
            1::bigint,
            (
                select count(*)::bigint
                 where has_function_privilege(
                     'authenticated',
                     'public.accept_organization_invitation(uuid, boolean)',
                     'EXECUTE'
                 )
                   and not has_function_privilege(
                     'anon',
                     'public.accept_organization_invitation(uuid, boolean)',
                     'EXECUTE'
                 )
            )
        ),
        (
            5,
            'Inny e-mail wymaga jawnego potwierdzenia',
            1::bigint,
            (
                select count(*)::bigint
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public'
                   and p.proname = 'accept_organization_invitation'
                   and pg_get_functiondef(p.oid) like
                       '%p_accept_different_email%'
            )
        ),
        (
            6,
            'Istniejące konto zaproszonego adresu blokuje inne konto',
            1::bigint,
            (
                select count(*)::bigint
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public'
                   and p.proname = 'accept_organization_invitation'
                   and pg_get_functiondef(p.oid) like '%from auth.users%'
                   and pg_get_functiondef(p.oid) like
                       '%istnieje już osobne konto CRPE%'
            )
        ),
        (
            7,
            'Tryb przypisania jest zapisywany w audycie',
            1::bigint,
            (
                select count(*)::bigint
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public'
                   and p.proname = 'accept_organization_invitation'
                   and pg_get_functiondef(p.oid) like
                       '%existing_account_different_email%'
            )
        ),
        (
            8,
            'Adres logowania nie jest zapisywany w szczegółach audytu',
            1::bigint,
            (
                select count(*)::bigint
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public'
                   and p.proname = 'accept_organization_invitation'
                   and pg_get_functiondef(p.oid) not like
                       '%jsonb_build_object(%account_email%'
            )
        ),
        (
            9,
            'Logowanie przy zaproszeniu może używać istniejącego konta',
            1::bigint,
            (
                select count(*)::bigint
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public'
                   and p.proname =
                       'mark_organization_invitation_authenticated'
                   and pg_get_functiondef(p.oid) not like
                       '%email_normalized = v_auth_email%'
            )
        ),
        (
            10,
            'Tokeny zaproszeń pozostają unikalne',
            0::bigint,
            (
                select count(*)::bigint
                  from (
                      select token
                        from public.organization_invitations
                       group by token
                      having count(*) > 1
                  ) duplicates
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
