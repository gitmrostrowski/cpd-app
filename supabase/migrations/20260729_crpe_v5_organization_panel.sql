-- CRPE v5 / Supabase Frankfurt
-- Pierwszy działający panel placówki: role, zakres jednostki, zaproszenia,
-- dziennik operacji i bezpieczne funkcje aplikacyjne.
--
-- Model dostępu:
-- 1. członkostwo mówi, do jakiej organizacji należy użytkownik;
-- 2. rola organizacyjna działa w całej placówce;
-- 3. rola jednostkowa działa tylko w wybranym oddziale / zespole;
-- 4. RLS i funkcje bazy egzekwują dostęp niezależnie od interfejsu.
--
-- Skrypt jest idempotentny i nie zmienia aktywności, cykli ani certyfikatów.

begin;

grant usage on schema public to authenticated;

create table if not exists public.organization_role_permissions (
    role_code text not null,
    permission_code text not null,
    created_at timestamptz not null default now(),
    primary key (role_code, permission_code),
    constraint organization_role_permissions_role_check
        check (role_code in (
            'owner', 'admin', 'coordinator', 'reviewer',
            'training_manager', 'report_viewer', 'member'
        )),
    constraint organization_role_permissions_permission_check
        check (permission_code in (
            'organization.view',
            'dashboard.view',
            'members.view',
            'members.manage',
            'roles.manage',
            'owner.manage',
            'units.view',
            'units.manage',
            'invitations.view',
            'invitations.manage',
            'reviews.view',
            'reviews.manage',
            'reports.view',
            'audit.view',
            'settings.manage'
        ))
);

insert into public.organization_role_permissions (role_code, permission_code)
values
    ('owner', 'organization.view'),
    ('owner', 'dashboard.view'),
    ('owner', 'members.view'),
    ('owner', 'members.manage'),
    ('owner', 'roles.manage'),
    ('owner', 'owner.manage'),
    ('owner', 'units.view'),
    ('owner', 'units.manage'),
    ('owner', 'invitations.view'),
    ('owner', 'invitations.manage'),
    ('owner', 'reviews.view'),
    ('owner', 'reviews.manage'),
    ('owner', 'reports.view'),
    ('owner', 'audit.view'),
    ('owner', 'settings.manage'),

    ('admin', 'organization.view'),
    ('admin', 'dashboard.view'),
    ('admin', 'members.view'),
    ('admin', 'members.manage'),
    ('admin', 'roles.manage'),
    ('admin', 'units.view'),
    ('admin', 'units.manage'),
    ('admin', 'invitations.view'),
    ('admin', 'invitations.manage'),
    ('admin', 'reviews.view'),
    ('admin', 'reviews.manage'),
    ('admin', 'reports.view'),
    ('admin', 'audit.view'),
    ('admin', 'settings.manage'),

    ('coordinator', 'organization.view'),
    ('coordinator', 'dashboard.view'),
    ('coordinator', 'members.view'),
    ('coordinator', 'units.view'),
    ('coordinator', 'reviews.view'),
    ('coordinator', 'reports.view'),

    ('reviewer', 'organization.view'),
    ('reviewer', 'dashboard.view'),
    ('reviewer', 'members.view'),
    ('reviewer', 'units.view'),
    ('reviewer', 'reviews.view'),
    ('reviewer', 'reviews.manage'),

    ('report_viewer', 'organization.view'),
    ('report_viewer', 'dashboard.view'),
    ('report_viewer', 'units.view'),
    ('report_viewer', 'reports.view'),

    ('training_manager', 'organization.view'),
    ('training_manager', 'dashboard.view'),

    ('member', 'organization.view'),
    ('member', 'dashboard.view')
on conflict (role_code, permission_code) do nothing;

create table if not exists public.organization_unit_role_assignments (
    id uuid primary key default gen_random_uuid(),
    membership_id uuid not null
        references public.organization_memberships(id) on delete cascade,
    unit_id uuid not null
        references public.organization_units(id) on delete cascade,
    role_code text not null,
    granted_by uuid
        references public.profiles(id) on delete set null,
    granted_at timestamptz not null default now(),
    revoked_at timestamptz,
    constraint organization_unit_role_assignments_role_check
        check (role_code in ('coordinator', 'reviewer', 'report_viewer')),
    constraint organization_unit_role_assignments_unique
        unique (membership_id, unit_id, role_code)
);

create index if not exists organization_unit_roles_membership_idx
    on public.organization_unit_role_assignments (membership_id)
    where revoked_at is null;

create index if not exists organization_unit_roles_unit_idx
    on public.organization_unit_role_assignments (unit_id, role_code)
    where revoked_at is null;

create table if not exists public.organization_invitations (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,
    email_normalized text not null,
    token uuid not null default gen_random_uuid(),
    role_code text not null default 'member',
    unit_id uuid
        references public.organization_units(id) on delete set null,
    status text not null default 'pending',
    invited_by uuid not null
        references public.profiles(id) on delete restrict,
    invited_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '14 days'),
    accepted_by uuid
        references public.profiles(id) on delete set null,
    accepted_at timestamptz,
    revoked_at timestamptz,
    constraint organization_invitations_email_check
        check (
            email_normalized = lower(btrim(email_normalized))
            and position('@' in email_normalized) > 1
            and char_length(email_normalized) <= 320
        ),
    constraint organization_invitations_token_unique unique (token),
    constraint organization_invitations_role_check
        check (role_code in (
            'admin', 'coordinator', 'reviewer', 'report_viewer', 'member'
        )),
    constraint organization_invitations_status_check
        check (status in ('pending', 'accepted', 'expired', 'revoked')),
    constraint organization_invitations_acceptance_check
        check (
            (status = 'accepted' and accepted_by is not null and accepted_at is not null)
            or status <> 'accepted'
        )
);

create unique index if not exists organization_invitations_pending_email_unique
    on public.organization_invitations (organization_id, email_normalized)
    where status = 'pending' and revoked_at is null;

create index if not exists organization_invitations_org_status_idx
    on public.organization_invitations (organization_id, status, invited_at desc);

update public.organization_invitations
   set status = 'expired'
 where status = 'pending'
   and expires_at <= now();

create table if not exists public.organization_audit_events (
    id bigint generated by default as identity primary key,
    organization_id uuid not null
        references public.organizations(id) on delete cascade,
    actor_user_id uuid
        references public.profiles(id) on delete set null,
    event_code text not null,
    target_type text,
    target_id text,
    details jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint organization_audit_events_code_length
        check (char_length(event_code) between 3 and 100),
    constraint organization_audit_events_target_length
        check (target_type is null or char_length(target_type) <= 80)
);

create index if not exists organization_audit_events_org_created_idx
    on public.organization_audit_events (organization_id, created_at desc);

alter table public.organization_role_permissions enable row level security;
alter table public.organization_unit_role_assignments enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.organization_audit_events enable row level security;

create or replace function public.has_organization_permission(
    target_organization_id uuid,
    accepted_permission text,
    target_unit_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
    select exists (
        select 1
        from public.organization_memberships m
        join public.organization_membership_roles mr
          on mr.membership_id = m.id
        join public.organization_role_permissions rp
          on rp.role_code = mr.role_code
        where m.organization_id = target_organization_id
          and m.user_id = (select auth.uid())
          and m.status = 'active'
          and rp.permission_code = accepted_permission
    )
    or (
        target_unit_id is not null
        and exists (
            select 1
            from public.organization_memberships m
            join public.organization_unit_role_assignments ur
              on ur.membership_id = m.id
             and ur.unit_id = target_unit_id
             and ur.revoked_at is null
            join public.organization_role_permissions rp
              on rp.role_code = ur.role_code
            join public.organization_units u
              on u.id = ur.unit_id
             and u.organization_id = target_organization_id
            where m.organization_id = target_organization_id
              and m.user_id = (select auth.uid())
              and m.status = 'active'
              and rp.permission_code = accepted_permission
        )
    );
$function$;

revoke all on function public.has_organization_permission(uuid, text, uuid) from public;
grant execute on function public.has_organization_permission(uuid, text, uuid)
    to authenticated;

drop policy if exists organization_role_permissions_select_authenticated
    on public.organization_role_permissions;
create policy organization_role_permissions_select_authenticated
    on public.organization_role_permissions
    for select
    to authenticated
    using (true);

drop policy if exists organization_unit_roles_select_authorized
    on public.organization_unit_role_assignments;
create policy organization_unit_roles_select_authorized
    on public.organization_unit_role_assignments
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.organization_memberships target_membership
            where target_membership.id = membership_id
              and (
                  target_membership.user_id = (select auth.uid())
                  or public.has_organization_permission(
                      target_membership.organization_id,
                      'members.view',
                      unit_id
                  )
              )
        )
    );

drop policy if exists organization_invitations_select_managers
    on public.organization_invitations;
create policy organization_invitations_select_managers
    on public.organization_invitations
    for select
    to authenticated
    using (
        public.has_organization_permission(
            organization_id,
            'invitations.view',
            unit_id
        )
    );

drop policy if exists organization_audit_events_select_authorized
    on public.organization_audit_events;
create policy organization_audit_events_select_authorized
    on public.organization_audit_events
    for select
    to authenticated
    using (
        public.has_organization_permission(
            organization_id,
            'audit.view',
            null
        )
    );

grant select on table public.organization_role_permissions to authenticated;
grant select on table public.organization_unit_role_assignments to authenticated;
grant select on table public.organization_invitations to authenticated;
grant select on table public.organization_audit_events to authenticated;

create or replace function public.get_my_organization_contexts()
returns table (
    organization_id uuid,
    membership_id uuid,
    display_name text,
    organization_status text,
    primary_role text,
    role_codes text[]
)
language sql
stable
security definer
set search_path = ''
as $function$
    select
        o.id,
        m.id,
        o.display_name,
        o.status,
        coalesce(
            (
                select mr.role_code
                from public.organization_membership_roles mr
                where mr.membership_id = m.id
                order by case mr.role_code
                    when 'owner' then 1
                    when 'admin' then 2
                    when 'coordinator' then 3
                    when 'reviewer' then 4
                    when 'report_viewer' then 5
                    when 'training_manager' then 6
                    else 7
                end
                limit 1
            ),
            'member'
        ) as primary_role,
        coalesce(
            (
                select array_agg(mr.role_code order by mr.role_code)
                from public.organization_membership_roles mr
                where mr.membership_id = m.id
            ),
            array['member']::text[]
        ) as role_codes
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.user_id = (select auth.uid())
      and m.status = 'active'
      and o.deleted_at is null
      and o.status in ('active', 'pending')
    order by o.display_name;
$function$;

revoke all on function public.get_my_organization_contexts() from public;
grant execute on function public.get_my_organization_contexts() to authenticated;

create or replace function public.get_organization_panel(
    p_organization_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
    v_user_id uuid := (select auth.uid());
    v_membership_id uuid;
    v_can_view_members boolean;
    v_can_view_invites boolean;
    v_can_view_audit boolean;
    v_result jsonb;
begin
    select m.id
      into v_membership_id
      from public.organization_memberships m
     where m.organization_id = p_organization_id
       and m.user_id = v_user_id
       and m.status = 'active';

    if v_membership_id is null then
        raise exception 'Brak aktywnego członkostwa w tej placówce.'
            using errcode = '42501';
    end if;

    v_can_view_members := public.has_organization_permission(
        p_organization_id, 'members.view', null
    );
    v_can_view_invites := public.has_organization_permission(
        p_organization_id, 'invitations.view', null
    );
    v_can_view_audit := public.has_organization_permission(
        p_organization_id, 'audit.view', null
    );

    select jsonb_build_object(
        'organization',
        jsonb_build_object(
            'id', o.id,
            'display_name', o.display_name,
            'legal_name', o.legal_name,
            'status', o.status,
            'slug', o.slug
        ),
        'current_membership_id', v_membership_id,
        'permissions',
        coalesce(
            (
                select jsonb_agg(distinct permission_code order by permission_code)
                from (
                    select rp.permission_code
                    from public.organization_membership_roles mr
                    join public.organization_role_permissions rp
                      on rp.role_code = mr.role_code
                    where mr.membership_id = v_membership_id
                    union
                    select rp.permission_code
                    from public.organization_unit_role_assignments ur
                    join public.organization_role_permissions rp
                      on rp.role_code = ur.role_code
                    where ur.membership_id = v_membership_id
                      and ur.revoked_at is null
                ) permission_rows
            ),
            '[]'::jsonb
        ),
        'current_roles',
        coalesce(
            (
                select jsonb_agg(mr.role_code order by mr.role_code)
                from public.organization_membership_roles mr
                where mr.membership_id = v_membership_id
            ),
            '["member"]'::jsonb
        ),
        'summary',
        jsonb_build_object(
            'active_members',
            case when v_can_view_members then (
                select count(*)
                from public.organization_memberships m
                where m.organization_id = p_organization_id
                  and m.status = 'active'
            ) else 1 end,
            'units',
            (
                select count(*)
                from public.organization_units u
                where u.organization_id = p_organization_id
                  and u.deleted_at is null
                  and u.status = 'active'
            ),
            'shared_activities',
            case when public.has_organization_permission(
                p_organization_id, 'reviews.view', null
            ) then (
                select count(*)
                from public.activity_organization_shares s
                where s.organization_id = p_organization_id
                  and s.revoked_at is null
            ) else 0 end,
            'pending_reviews',
            case when public.has_organization_permission(
                p_organization_id, 'reviews.view', null
            ) then (
                select count(*)
                from public.activity_reviews r
                where r.organization_id = p_organization_id
                  and r.status = 'pending'
            ) else 0 end,
            'pending_invitations',
            case when v_can_view_invites then (
                select count(*)
                from public.organization_invitations i
                where i.organization_id = p_organization_id
                  and i.status = 'pending'
                  and i.revoked_at is null
                  and i.expires_at > now()
            ) else 0 end
        ),
        'units',
        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'id', u.id,
                        'name', u.name,
                        'unit_type', u.unit_type,
                        'parent_unit_id', u.parent_unit_id,
                        'status', u.status,
                        'member_count', (
                            select count(*)
                            from public.membership_unit_assignments a
                            join public.organization_memberships m on m.id = a.membership_id
                            where a.unit_id = u.id
                              and m.status = 'active'
                        )
                    )
                    order by u.name
                )
                from public.organization_units u
                where u.organization_id = p_organization_id
                  and u.deleted_at is null
            ),
            '[]'::jsonb
        ),
        'members',
        case when v_can_view_members then coalesce(
            (
                select jsonb_agg(member_row order by member_row->>'last_name', member_row->>'first_name')
                from (
                    select jsonb_build_object(
                        'membership_id', m.id,
                        'user_id', m.user_id,
                        'first_name', p.first_name,
                        'last_name', p.last_name,
                        'status', m.status,
                        'joined_at', m.joined_at,
                        'profession', profession.name_pl,
                        'organization_roles', coalesce(
                            (
                                select jsonb_agg(mr.role_code order by mr.role_code)
                                from public.organization_membership_roles mr
                                where mr.membership_id = m.id
                            ),
                            '["member"]'::jsonb
                        ),
                        'units', coalesce(
                            (
                                select jsonb_agg(
                                    jsonb_build_object('id', u.id, 'name', u.name)
                                    order by u.name
                                )
                                from public.membership_unit_assignments a
                                join public.organization_units u on u.id = a.unit_id
                                where a.membership_id = m.id
                            ),
                            '[]'::jsonb
                        ),
                        'unit_roles', coalesce(
                            (
                                select jsonb_agg(
                                    jsonb_build_object(
                                        'id', ur.id,
                                        'unit_id', ur.unit_id,
                                        'unit_name', u.name,
                                        'role_code', ur.role_code
                                    )
                                    order by u.name, ur.role_code
                                )
                                from public.organization_unit_role_assignments ur
                                join public.organization_units u on u.id = ur.unit_id
                                where ur.membership_id = m.id
                                  and ur.revoked_at is null
                            ),
                            '[]'::jsonb
                        )
                    ) as member_row
                    from public.organization_memberships m
                    join public.profiles p on p.id = m.user_id
                    left join lateral (
                        select pr.name_pl
                        from public.medical_professionals mp
                        join public.professions pr on pr.id = mp.profession_id
                        where mp.user_id = m.user_id
                        limit 1
                    ) profession on true
                    where m.organization_id = p_organization_id
                      and m.status in ('active', 'suspended')
                ) rows_for_members
            ),
            '[]'::jsonb
        ) else (
            select jsonb_agg(
                jsonb_build_object(
                    'membership_id', m.id,
                    'user_id', m.user_id,
                    'first_name', p.first_name,
                    'last_name', p.last_name,
                    'status', m.status,
                    'organization_roles', coalesce(
                        (
                            select jsonb_agg(mr.role_code order by mr.role_code)
                            from public.organization_membership_roles mr
                            where mr.membership_id = m.id
                        ),
                        '["member"]'::jsonb
                    ),
                    'units', '[]'::jsonb,
                    'unit_roles', '[]'::jsonb
                )
            )
            from public.organization_memberships m
            join public.profiles p on p.id = m.user_id
            where m.id = v_membership_id
        ) end,
        'invitations',
        case when v_can_view_invites then coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'id', i.id,
                        'email', i.email_normalized,
                        'token', i.token,
                        'role_code', i.role_code,
                        'unit_id', i.unit_id,
                        'unit_name', u.name,
                        'status',
                            case
                                when i.status = 'pending' and i.expires_at <= now() then 'expired'
                                else i.status
                            end,
                        'invited_at', i.invited_at,
                        'expires_at', i.expires_at
                    )
                    order by i.invited_at desc
                )
                from public.organization_invitations i
                left join public.organization_units u on u.id = i.unit_id
                where i.organization_id = p_organization_id
                  and i.revoked_at is null
            ),
            '[]'::jsonb
        ) else '[]'::jsonb end,
        'audit_events',
        case when v_can_view_audit then coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'id', event_rows.id,
                        'event_code', event_rows.event_code,
                        'target_type', event_rows.target_type,
                        'details', event_rows.details,
                        'created_at', event_rows.created_at,
                        'actor_name', btrim(
                            coalesce(event_rows.first_name, '') || ' ' ||
                            coalesce(event_rows.last_name, '')
                        )
                    )
                    order by event_rows.created_at desc
                )
                from (
                    select e.*, p.first_name, p.last_name
                    from public.organization_audit_events e
                    left join public.profiles p on p.id = e.actor_user_id
                    where e.organization_id = p_organization_id
                    order by e.created_at desc
                    limit 20
                ) event_rows
            ),
            '[]'::jsonb
        ) else '[]'::jsonb end
    )
    into v_result
    from public.organizations o
    where o.id = p_organization_id
      and o.deleted_at is null;

    if v_result is null then
        raise exception 'Placówka nie istnieje.';
    end if;

    return v_result;
end
$function$;

revoke all on function public.get_organization_panel(uuid) from public;
grant execute on function public.get_organization_panel(uuid) to authenticated;

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
begin
    if v_email = '' or position('@' in v_email) <= 1 or char_length(v_email) > 320 then
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
           expires_at = now() + interval '14 days'
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
        'expires_at', v_invitation.expires_at
    );
end
$function$;

revoke all on function public.create_organization_invitation(uuid, text, text, uuid)
    from public;
grant execute on function public.create_organization_invitation(uuid, text, text, uuid)
    to authenticated;

create or replace function public.accept_organization_invitation(
    p_token uuid
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
begin
    if v_user_id is null then
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

    if v_auth_email = '' or v_auth_email <> v_invitation.email_normalized then
        raise exception 'Zaloguj się kontem zaproszonym na adres %.', v_invitation.email_normalized
            using errcode = '42501';
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
           accepted_at = now()
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
        jsonb_build_object('role_code', v_invitation.role_code, 'unit_id', v_invitation.unit_id)
    );

    return jsonb_build_object(
        'organization_id', v_invitation.organization_id,
        'membership_id', v_membership.id
    );
end
$function$;

revoke all on function public.accept_organization_invitation(uuid) from public;
grant execute on function public.accept_organization_invitation(uuid) to authenticated;

create or replace function public.create_organization_unit(
    p_organization_id uuid,
    p_name text,
    p_unit_type text default 'department',
    p_parent_unit_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_user_id uuid := (select auth.uid());
    v_unit_id uuid;
begin
    if not public.has_organization_permission(
        p_organization_id, 'units.manage', null
    ) then
        raise exception 'Brak uprawnienia do zarządzania strukturą.'
            using errcode = '42501';
    end if;

    if char_length(btrim(coalesce(p_name, ''))) < 1
       or char_length(btrim(p_name)) > 160 then
        raise exception 'Nazwa jednostki musi mieć od 1 do 160 znaków.';
    end if;

    if p_unit_type not in ('facility', 'branch', 'department', 'ward', 'team', 'other') then
        raise exception 'Nieprawidłowy typ jednostki.';
    end if;

    if p_parent_unit_id is not null and not exists (
        select 1
        from public.organization_units u
        where u.id = p_parent_unit_id
          and u.organization_id = p_organization_id
          and u.deleted_at is null
    ) then
        raise exception 'Jednostka nadrzędna nie należy do tej placówki.';
    end if;

    insert into public.organization_units (
        organization_id, parent_unit_id, name, unit_type, status, created_by
    )
    values (
        p_organization_id,
        p_parent_unit_id,
        btrim(p_name),
        p_unit_type,
        'active',
        v_user_id
    )
    returning id into v_unit_id;

    insert into public.organization_audit_events (
        organization_id, actor_user_id, event_code, target_type, target_id, details
    )
    values (
        p_organization_id,
        v_user_id,
        'unit.created',
        'unit',
        v_unit_id::text,
        jsonb_build_object('name', btrim(p_name), 'unit_type', p_unit_type)
    );

    return v_unit_id;
end
$function$;

revoke all on function public.create_organization_unit(uuid, text, text, uuid)
    from public;
grant execute on function public.create_organization_unit(uuid, text, text, uuid)
    to authenticated;

create or replace function public.set_organization_role(
    p_membership_id uuid,
    p_role_code text,
    p_unit_id uuid default null,
    p_enabled boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_actor uuid := (select auth.uid());
    v_organization_id uuid;
    v_target_user_id uuid;
    v_active_owner_count integer;
begin
    select m.organization_id, m.user_id
      into v_organization_id, v_target_user_id
      from public.organization_memberships m
     where m.id = p_membership_id;

    if v_organization_id is null then
        raise exception 'Nie znaleziono członkostwa.';
    end if;

    if p_role_code in ('owner', 'admin') then
        if p_unit_id is not null then
            raise exception 'Właściciel i administrator działają wyłącznie na poziomie całej placówki.';
        end if;
        if not public.has_organization_permission(
            v_organization_id, 'owner.manage', null
        ) then
            raise exception 'Tylko właściciel może zarządzać tą rolą.'
                using errcode = '42501';
        end if;
    elsif p_role_code in ('coordinator', 'reviewer', 'report_viewer') then
        if not public.has_organization_permission(
            v_organization_id, 'roles.manage', p_unit_id
        ) then
            raise exception 'Brak uprawnienia do zarządzania rolami.'
                using errcode = '42501';
        end if;
    else
        raise exception 'Tą funkcją można zarządzać tylko rolami panelu placówki.';
    end if;

    if p_unit_id is not null and not exists (
        select 1
        from public.organization_units u
        where u.id = p_unit_id
          and u.organization_id = v_organization_id
          and u.deleted_at is null
    ) then
        raise exception 'Jednostka nie należy do tej placówki.';
    end if;

    if p_role_code = 'owner' and not p_enabled then
        select count(*)
          into v_active_owner_count
          from public.organization_membership_roles mr
          join public.organization_memberships m on m.id = mr.membership_id
         where m.organization_id = v_organization_id
           and m.status = 'active'
           and mr.role_code = 'owner';

        if v_active_owner_count <= 1 then
            raise exception 'Placówka musi mieć co najmniej jednego aktywnego właściciela.';
        end if;
    end if;

    if p_unit_id is null then
        if p_enabled then
            insert into public.organization_membership_roles (
                membership_id, role_code, granted_by
            )
            values (p_membership_id, p_role_code, v_actor)
            on conflict (membership_id, role_code)
            do update set granted_by = excluded.granted_by, granted_at = now();
        else
            delete from public.organization_membership_roles
             where membership_id = p_membership_id
               and role_code = p_role_code;
        end if;
    else
        if p_enabled then
            insert into public.membership_unit_assignments (
                membership_id, unit_id, assigned_by
            )
            values (p_membership_id, p_unit_id, v_actor)
            on conflict (membership_id, unit_id) do nothing;

            insert into public.organization_unit_role_assignments (
                membership_id, unit_id, role_code, granted_by, revoked_at
            )
            values (p_membership_id, p_unit_id, p_role_code, v_actor, null)
            on conflict (membership_id, unit_id, role_code)
            do update set
                granted_by = excluded.granted_by,
                granted_at = now(),
                revoked_at = null;
        else
            update public.organization_unit_role_assignments
               set revoked_at = now()
             where membership_id = p_membership_id
               and unit_id = p_unit_id
               and role_code = p_role_code
               and revoked_at is null;
        end if;
    end if;

    insert into public.organization_audit_events (
        organization_id, actor_user_id, event_code, target_type, target_id, details
    )
    values (
        v_organization_id,
        v_actor,
        case when p_enabled then 'role.granted' else 'role.revoked' end,
        'membership',
        p_membership_id::text,
        jsonb_build_object(
            'role_code', p_role_code,
            'unit_id', p_unit_id,
            'target_user_id', v_target_user_id
        )
    );
end
$function$;

revoke all on function public.set_organization_role(uuid, text, uuid, boolean)
    from public;
grant execute on function public.set_organization_role(uuid, text, uuid, boolean)
    to authenticated;

create or replace function public.set_organization_membership_status(
    p_membership_id uuid,
    p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_actor uuid := (select auth.uid());
    v_organization_id uuid;
    v_target_user_id uuid;
    v_is_owner boolean;
begin
    if p_status not in ('active', 'suspended', 'revoked') then
        raise exception 'Nieprawidłowy status członkostwa.';
    end if;

    select m.organization_id, m.user_id,
           public.membership_has_role(m.id, array['owner']::text[])
      into v_organization_id, v_target_user_id, v_is_owner
      from public.organization_memberships m
     where m.id = p_membership_id;

    if v_organization_id is null then
        raise exception 'Nie znaleziono członkostwa.';
    end if;

    if v_target_user_id = v_actor then
        raise exception 'Nie można zmienić statusu własnego członkostwa w tym widoku.';
    end if;

    if v_is_owner then
        if not public.has_organization_permission(
            v_organization_id, 'owner.manage', null
        ) then
            raise exception 'Tylko właściciel może zarządzać członkostwem właściciela.'
                using errcode = '42501';
        end if;
        if p_status <> 'active' and (
            select count(*)
            from public.organization_membership_roles mr
            join public.organization_memberships m on m.id = mr.membership_id
            where m.organization_id = v_organization_id
              and m.status = 'active'
              and mr.role_code = 'owner'
        ) <= 1 then
            raise exception 'Placówka musi mieć co najmniej jednego aktywnego właściciela.';
        end if;
    elsif not public.has_organization_permission(
        v_organization_id, 'members.manage', null
    ) then
        raise exception 'Brak uprawnienia do zarządzania członkostwem.'
            using errcode = '42501';
    end if;

    update public.organization_memberships
       set status = p_status,
           joined_at = case when p_status = 'active' then coalesce(joined_at, now()) else joined_at end,
           ended_at = case when p_status = 'revoked' then now() else null end
     where id = p_membership_id;

    insert into public.organization_audit_events (
        organization_id, actor_user_id, event_code, target_type, target_id, details
    )
    values (
        v_organization_id,
        v_actor,
        'membership.status_changed',
        'membership',
        p_membership_id::text,
        jsonb_build_object('status', p_status, 'target_user_id', v_target_user_id)
    );
end
$function$;

revoke all on function public.set_organization_membership_status(uuid, text)
    from public;
grant execute on function public.set_organization_membership_status(uuid, text)
    to authenticated;

-- Testowa placówka jest przypisywana do aktywnego administratora platformy.
-- Dzięki temu po wdrożeniu v5 można od razu wejść do panelu własnym kontem.
do $pilot$
declare
    v_owner_id uuid;
    v_organization_id uuid;
    v_membership_id uuid;
begin
    select psr.user_id
      into v_owner_id
      from public.platform_staff_roles psr
     where psr.role_code = 'platform_admin'
       and psr.revoked_at is null
     order by psr.granted_at, psr.user_id
     limit 1;

    if v_owner_id is null then
        raise exception 'Brak aktywnego platform_admin. Nie można utworzyć placówki pilotażowej.';
    end if;

    insert into public.organizations (
        legal_name, display_name, slug, status, created_by
    )
    values (
        'CRPE Placówka Pilotażowa',
        'Placówka pilotażowa CRPE',
        'crpe-placowka-pilotazowa',
        'active',
        v_owner_id
    )
    on conflict (slug)
    do update set
        status = 'active',
        deleted_at = null
    returning id into v_organization_id;

    insert into public.organization_capabilities (
        organization_id, capability_code, enabled_by
    )
    values (
        v_organization_id, 'healthcare_provider', v_owner_id
    )
    on conflict (organization_id, capability_code) do nothing;

    insert into public.organization_memberships (
        organization_id, user_id, status, joined_at, created_by
    )
    values (
        v_organization_id, v_owner_id, 'active', now(), v_owner_id
    )
    on conflict (organization_id, user_id)
    do update set status = 'active', ended_at = null
    returning id into v_membership_id;

    insert into public.organization_membership_roles (
        membership_id, role_code, granted_by
    )
    values
        (v_membership_id, 'owner', v_owner_id),
        (v_membership_id, 'member', v_owner_id)
    on conflict (membership_id, role_code) do nothing;

    insert into public.organization_units (
        organization_id, name, unit_type, status, created_by
    )
    select
        v_organization_id,
        'Jednostka pilotażowa',
        'department',
        'active',
        v_owner_id
    where not exists (
        select 1
        from public.organization_units u
        where u.organization_id = v_organization_id
          and u.name = 'Jednostka pilotażowa'
          and u.deleted_at is null
    );
end
$pilot$;

commit;

-- Wynik kontrolny: wszystkie 12 wierszy powinno mieć wynik OK.
with pilot as (
    select o.id
    from public.organizations o
    where o.slug = 'crpe-placowka-pilotazowa'
),
tests(lp, test, oczekiwano, znaleziono) as (
    values
        (
            1,
            'Tabele fundamentu panelu placówki',
            4::bigint,
            (
                select count(*)::bigint
                from information_schema.tables
                where table_schema = 'public'
                  and table_name in (
                      'organization_role_permissions',
                      'organization_unit_role_assignments',
                      'organization_invitations',
                      'organization_audit_events'
                  )
            )
        ),
        (
            2,
            'Macierz uprawnień właściciela',
            15::bigint,
            (
                select count(*)::bigint
                from public.organization_role_permissions
                where role_code = 'owner'
            )
        ),
        (
            3,
            'Administrator nie może zarządzać właścicielem',
            0::bigint,
            (
                select count(*)::bigint
                from public.organization_role_permissions
                where role_code = 'admin'
                  and permission_code = 'owner.manage'
            )
        ),
        (
            4,
            'Funkcja sprawdzania uprawnienia',
            1::bigint,
            (
                select count(*)::bigint
                from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public'
                  and p.proname = 'has_organization_permission'
            )
        ),
        (
            5,
            'Funkcje panelu i zaproszeń',
            7::bigint,
            (
                select count(*)::bigint
                from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public'
                  and p.proname in (
                      'get_my_organization_contexts',
                      'get_organization_panel',
                      'create_organization_invitation',
                      'accept_organization_invitation',
                      'create_organization_unit',
                      'set_organization_role',
                      'set_organization_membership_status'
                  )
            )
        ),
        (
            6,
            'RLS na nowych tabelach',
            4::bigint,
            (
                select count(*)::bigint
                from pg_class c
                join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public'
                  and c.relname in (
                      'organization_role_permissions',
                      'organization_unit_role_assignments',
                      'organization_invitations',
                      'organization_audit_events'
                  )
                  and c.relrowsecurity
            )
        ),
        (
            7,
            'Odczyt nowych tabel dla authenticated',
            4::bigint,
            (
                select count(*)::bigint
                from (
                    values
                        ('organization_role_permissions'),
                        ('organization_unit_role_assignments'),
                        ('organization_invitations'),
                        ('organization_audit_events')
                ) t(table_name)
                where has_table_privilege(
                    'authenticated',
                    format('public.%I', t.table_name),
                    'SELECT'
                )
            )
        ),
        (
            8,
            'Placówka pilotażowa aktywna',
            1::bigint,
            (
                select count(*)::bigint
                from public.organizations
                where slug = 'crpe-placowka-pilotazowa'
                  and status = 'active'
                  and deleted_at is null
            )
        ),
        (
            9,
            'Placówka ma capability healthcare_provider',
            1::bigint,
            (
                select count(*)::bigint
                from public.organization_capabilities c
                join pilot on pilot.id = c.organization_id
                where c.capability_code = 'healthcare_provider'
            )
        ),
        (
            10,
            'Placówka ma jednego aktywnego właściciela',
            1::bigint,
            (
                select count(*)::bigint
                from public.organization_memberships m
                join pilot on pilot.id = m.organization_id
                join public.organization_membership_roles r on r.membership_id = m.id
                where m.status = 'active'
                  and r.role_code = 'owner'
            )
        ),
        (
            11,
            'Placówka ma jednostkę pilotażową',
            1::bigint,
            (
                select count(*)::bigint
                from public.organization_units u
                join pilot on pilot.id = u.organization_id
                where u.name = 'Jednostka pilotażowa'
                  and u.deleted_at is null
            )
        ),
        (
            12,
            'Brak oczekujących zaproszeń z przeszłą datą ważności',
            0::bigint,
            (
                select count(*)::bigint
                from public.organization_invitations
                where status = 'pending'
                  and expires_at <= now()
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
