-- CRPE v5.1c / bezpieczne rozpoznanie konta dla ważnego zaproszenia
-- Uruchomić jeden raz po migracji v5.1 FIX2.

begin;

create or replace function public.get_organization_invitation_landing(
    p_token uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
    v_invitation public.organization_invitations;
    v_organization_name text;
    v_unit_name text;
    v_account_exists boolean := false;
    v_reason text;
begin
    select i.*
      into v_invitation
      from public.organization_invitations i
     where i.token = p_token;

    if v_invitation.id is null then
        return jsonb_build_object(
            'valid', false,
            'reason', 'not_found',
            'account_exists', null
        );
    end if;

    if v_invitation.status = 'accepted' then
        v_reason := 'accepted';
    elsif v_invitation.status = 'revoked'
       or v_invitation.revoked_at is not null then
        v_reason := 'revoked';
    elsif v_invitation.expires_at <= now() then
        v_reason := 'expired';
    elsif v_invitation.status <> 'pending' then
        v_reason := 'unavailable';
    else
        v_reason := 'valid';
    end if;

    if v_reason <> 'valid' then
        return jsonb_build_object(
            'valid', false,
            'reason', v_reason,
            'account_exists', null
        );
    end if;

    select o.display_name
      into v_organization_name
      from public.organizations o
     where o.id = v_invitation.organization_id;

    if v_invitation.unit_id is not null then
        select u.name
          into v_unit_name
          from public.organization_units u
         where u.id = v_invitation.unit_id;
    end if;

    select exists (
        select 1
          from auth.users u
         where lower(btrim(coalesce(u.email, ''))) =
               v_invitation.email_normalized
    )
      into v_account_exists;

    return jsonb_build_object(
        'valid', true,
        'reason', 'valid',
        'email', v_invitation.email_normalized,
        'account_exists', v_account_exists,
        'organization_name', coalesce(v_organization_name, 'placówki'),
        'role_code', v_invitation.role_code,
        'unit_name', v_unit_name,
        'expires_at', v_invitation.expires_at
    );
end
$function$;

revoke all on function public.get_organization_invitation_landing(uuid)
    from public;
grant execute on function public.get_organization_invitation_landing(uuid)
    to anon, authenticated;

commit;

-- Wynik kontrolny: wszystkie 7 wierszy powinno mieć wynik OK.
with tests(lp, test, oczekiwano, znaleziono) as (
    values
        (
            1,
            'Funkcja strony zaproszenia istnieje',
            1::bigint,
            (
                select count(*)::bigint
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public'
                   and p.proname = 'get_organization_invitation_landing'
                   and pg_get_function_identity_arguments(p.oid) = 'p_token uuid'
            )
        ),
        (
            2,
            'Funkcja działa z prawami właściciela',
            1::bigint,
            (
                select count(*)::bigint
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public'
                   and p.proname = 'get_organization_invitation_landing'
                   and p.prosecdef
            )
        ),
        (
            3,
            'Funkcja zwraca JSON',
            1::bigint,
            (
                select count(*)::bigint
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public'
                   and p.proname = 'get_organization_invitation_landing'
                   and pg_get_function_result(p.oid) = 'jsonb'
            )
        ),
        (
            4,
            'Anonimowy odbiorca może sprawdzić ważny link',
            1::bigint,
            (
                select count(*)::bigint
                 where has_function_privilege(
                     'anon',
                     'public.get_organization_invitation_landing(uuid)',
                     'EXECUTE'
                 )
            )
        ),
        (
            5,
            'Zalogowany odbiorca może sprawdzić ważny link',
            1::bigint,
            (
                select count(*)::bigint
                 where has_function_privilege(
                     'authenticated',
                     'public.get_organization_invitation_landing(uuid)',
                     'EXECUTE'
                 )
            )
        ),
        (
            6,
            'Rozpoznanie konta korzysta z auth.users',
            1::bigint,
            (
                select count(*)::bigint
                  from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public'
                   and p.proname = 'get_organization_invitation_landing'
                   and pg_get_functiondef(p.oid) like '%from auth.users%'
            )
        ),
        (
            7,
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
