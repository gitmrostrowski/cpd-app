-- CRPE / Supabase Frankfurt
-- Spójna naprawa uprawnień aplikacji, RLS i statusów szkoleń po migracji UK.
-- Skrypt jest idempotentny: można uruchomić go ponownie bez dublowania danych.

begin;

grant usage on schema public to authenticated;

-- Granty są celowo zgodne z istniejącymi politykami RLS.
-- Same granty nie omijają RLS i nie pozwalają użytkownikom czytać cudzych danych.
grant select, insert, update, delete
on table public.activity_documents
to authenticated;

grant select, insert, update, delete
on table public.activity_organization_shares
to authenticated;

grant select, insert, update, delete
on table public.activity_point_entries
to authenticated;

grant select, insert, update
on table public.activity_reviews
to authenticated;

grant select
on table public.activity_types
to authenticated;

grant select, insert, update, delete
on table public.cpd_cycles
to authenticated;

grant select, insert, update, delete
on table public.educational_activities
to authenticated;

grant select, insert, update
on table public.medical_professionals
to authenticated;

grant select, insert, update, delete
on table public.membership_unit_assignments
to authenticated;

grant select
on table public.organization_capabilities
to authenticated;

grant select, insert, update, delete
on table public.organization_membership_roles
to authenticated;

grant select, insert, update, delete
on table public.organization_memberships
to authenticated;

grant select, insert, update, delete
on table public.organization_units
to authenticated;

grant select
on table public.organizations
to authenticated;

grant select
on table public.platform_staff_roles
to authenticated;

grant select, insert, update, delete
on table public.professional_identifiers
to authenticated;

grant select
on table public.professions
to authenticated;

grant select, update
on table public.profiles
to authenticated;

grant select, insert, update, delete
on table public.trainings
to authenticated;

-- Aplikacja sprawdza rolę zalogowanego użytkownika w nagłówku i panelu admina.
-- Polityka ujawnia wyłącznie jego własne role.
do $policy$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'platform_staff_roles'
          and policyname = 'platform_staff_roles_select_own'
    ) then
        create policy platform_staff_roles_select_own
        on public.platform_staff_roles
        for select
        to authenticated
        using (user_id = (select auth.uid()));
    end if;
end
$policy$;

-- Cykle utworzone przez użytkownika i cykle przeniesione z UK są jego własnymi
-- cyklami. Organizacyjne i systemowe pozostają niemodyfikowalne przez użytkownika.
alter policy cpd_cycles_update_own
on public.cpd_cycles
using (user_id = (select auth.uid()))
with check (
    user_id = (select auth.uid())
    and source in ('user', 'migration')
);

-- W UK 15 szkoleń miało status approved. We Frankfurcie zostały tymczasowo
-- zapisane jako pending, ponieważ nowy model wymaga approved_by i approved_at.
-- Przywracamy ich wcześniejszy stan, przypisując migrację do aktywnego
-- administratora platformy. Oryginalny stan pozostaje w legacy_data.
do $training_restore$
declare
    v_admin_id uuid;
    v_migrated_count integer;
    v_approved_count integer;
    v_pending_count integer;
    v_rejected_count integer;
begin
    select psr.user_id
      into v_admin_id
      from public.platform_staff_roles psr
     where psr.role_code = 'platform_admin'
       and psr.revoked_at is null
     order by psr.granted_at asc, psr.user_id asc
     limit 1;

    if v_admin_id is null then
        raise exception
            'Brak aktywnego platform_admin. Nie można bezpiecznie przywrócić statusów szkoleń.';
    end if;

    select count(*)
      into v_migrated_count
      from public.trainings t
     where t.legacy_data ->> 'migration_source' = 'crpe_uk_2026_07_28';

    if v_migrated_count <> 17 then
        raise exception
            'Oczekiwano 17 szkoleń z migracji UK, znaleziono %.',
            v_migrated_count;
    end if;

    update public.trainings
       set approval_status = 'approved',
           approved_by = v_admin_id,
           approved_at = coalesce(approved_at, current_timestamp),
           reject_reason = null
     where legacy_data ->> 'migration_source' = 'crpe_uk_2026_07_28'
       and legacy_data ->> 'legacy_approval_status' = 'approved'
       and approval_status = 'pending';

    select
        count(*) filter (where approval_status = 'approved'),
        count(*) filter (where approval_status = 'pending'),
        count(*) filter (where approval_status = 'rejected')
      into v_approved_count, v_pending_count, v_rejected_count
      from public.trainings
     where legacy_data ->> 'migration_source' = 'crpe_uk_2026_07_28';

    if v_approved_count <> 15
       or v_pending_count <> 1
       or v_rejected_count <> 1 then
        raise exception
            'Nieprawidłowe statusy szkoleń po naprawie: approved=%, pending=%, rejected=%.',
            v_approved_count, v_pending_count, v_rejected_count;
    end if;
end
$training_restore$;

commit;

-- Wynik kontrolny. Wszystkie wiersze powinny mieć wynik OK.
with required_privileges(table_name, privilege_name) as (
    values
        ('activity_documents', 'SELECT'),
        ('activity_documents', 'INSERT'),
        ('activity_documents', 'UPDATE'),
        ('activity_documents', 'DELETE'),
        ('activity_organization_shares', 'SELECT'),
        ('activity_organization_shares', 'INSERT'),
        ('activity_organization_shares', 'UPDATE'),
        ('activity_organization_shares', 'DELETE'),
        ('activity_point_entries', 'SELECT'),
        ('activity_point_entries', 'INSERT'),
        ('activity_point_entries', 'UPDATE'),
        ('activity_point_entries', 'DELETE'),
        ('activity_reviews', 'SELECT'),
        ('activity_reviews', 'INSERT'),
        ('activity_reviews', 'UPDATE'),
        ('activity_types', 'SELECT'),
        ('cpd_cycles', 'SELECT'),
        ('cpd_cycles', 'INSERT'),
        ('cpd_cycles', 'UPDATE'),
        ('cpd_cycles', 'DELETE'),
        ('educational_activities', 'SELECT'),
        ('educational_activities', 'INSERT'),
        ('educational_activities', 'UPDATE'),
        ('educational_activities', 'DELETE'),
        ('medical_professionals', 'SELECT'),
        ('medical_professionals', 'INSERT'),
        ('medical_professionals', 'UPDATE'),
        ('membership_unit_assignments', 'SELECT'),
        ('membership_unit_assignments', 'INSERT'),
        ('membership_unit_assignments', 'UPDATE'),
        ('membership_unit_assignments', 'DELETE'),
        ('organization_capabilities', 'SELECT'),
        ('organization_membership_roles', 'SELECT'),
        ('organization_membership_roles', 'INSERT'),
        ('organization_membership_roles', 'UPDATE'),
        ('organization_membership_roles', 'DELETE'),
        ('organization_memberships', 'SELECT'),
        ('organization_memberships', 'INSERT'),
        ('organization_memberships', 'UPDATE'),
        ('organization_memberships', 'DELETE'),
        ('organization_units', 'SELECT'),
        ('organization_units', 'INSERT'),
        ('organization_units', 'UPDATE'),
        ('organization_units', 'DELETE'),
        ('organizations', 'SELECT'),
        ('platform_staff_roles', 'SELECT'),
        ('professional_identifiers', 'SELECT'),
        ('professional_identifiers', 'INSERT'),
        ('professional_identifiers', 'UPDATE'),
        ('professional_identifiers', 'DELETE'),
        ('professions', 'SELECT'),
        ('profiles', 'SELECT'),
        ('profiles', 'UPDATE'),
        ('trainings', 'SELECT'),
        ('trainings', 'INSERT'),
        ('trainings', 'UPDATE'),
        ('trainings', 'DELETE')
),
tests as (
    select
        1 as lp,
        'Brakujące granty głównych modułów'::text as test,
        0::bigint as oczekiwano,
        count(*) filter (
            where not has_table_privilege(
                'authenticated',
                format('public.%I', table_name),
                privilege_name
            )
        )::bigint as znaleziono
    from required_privileges

    union all
    select
        2,
        'Polityka odczytu własnej roli administratora',
        1,
        count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename = 'platform_staff_roles'
      and policyname = 'platform_staff_roles_select_own'

    union all
    select
        3,
        'Szkolenia zaakceptowane po migracji',
        15,
        count(*)::bigint
    from public.trainings
    where legacy_data ->> 'migration_source' = 'crpe_uk_2026_07_28'
      and approval_status = 'approved'

    union all
    select
        4,
        'Szkolenia pending po migracji',
        1,
        count(*)::bigint
    from public.trainings
    where legacy_data ->> 'migration_source' = 'crpe_uk_2026_07_28'
      and approval_status = 'pending'

    union all
    select
        5,
        'Szkolenia odrzucone po migracji',
        1,
        count(*)::bigint
    from public.trainings
    where legacy_data ->> 'migration_source' = 'crpe_uk_2026_07_28'
      and approval_status = 'rejected'

    union all
    select
        6,
        'Aktywności po migracji',
        32,
        count(*)::bigint
    from public.educational_activities
    where external_reference like 'crpe_uk:%'

    union all
    select
        7,
        'Dokumenty aktywności po migracji',
        4,
        count(*)::bigint
    from public.activity_documents d
    join public.educational_activities a on a.id = d.activity_id
    where a.external_reference like 'crpe_uk:%'

    union all
    select
        8,
        'Brakujące pliki certyfikatów w Storage',
        0,
        count(*)::bigint
    from public.activity_documents d
    join public.educational_activities a on a.id = d.activity_id
    where a.external_reference like 'crpe_uk:%'
      and not exists (
          select 1
          from storage.objects o
          where o.bucket_id = 'certificates'
            and o.name = d.path
      )
)
select
    test,
    oczekiwano,
    znaleziono,
    case when znaleziono = oczekiwano then 'OK' else 'BŁĄD' end as wynik
from tests
order by lp;
