-- CRPE v6.25.1 / bezpieczny import szkoleń z kolejką zmian źródłowych.
-- Ten jeden plik zastępuje niewdrożoną migrację v6.25. Można go również
-- uruchomić idempotentnie, jeżeli v6.25 została wcześniej wykonana.

begin;

-- Czytelna kontrola kontraktu istniejącej tabeli przed pierwszą zmianą DDL.
do $preflight$
declare
  v_missing text;
  v_column record;
  v_required_labels text[];
  v_missing_labels text;
begin
  if to_regclass('public.trainings') is null then
    raise exception
      'CRPE v6.25.1: brak tabeli public.trainings. Najpierw wdroż migracje bazowe CRPE.';
  end if;

  select string_agg(required.name, ', ' order by required.name)
    into v_missing
  from unnest(array[
    'id', 'title', 'organizer_name', 'points', 'delivery_format',
    'starts_on', 'ends_on', 'start_time', 'end_time', 'time_zone',
    'speakers', 'category', 'target_profession_text', 'audience_scope',
    'points_verification_status', 'points_source_url', 'points_verified_on',
    'location', 'external_url', 'topics', 'price_pln', 'has_recording',
    'capacity', 'enrollment_status', 'approval_status', 'submitted_by',
    'submitted_email', 'description', 'approved_by', 'approved_at',
    'reject_reason'
  ]) as required(name)
  where not exists (
    select 1
    from information_schema.columns column_info
    where column_info.table_schema = 'public'
      and column_info.table_name = 'trainings'
      and column_info.column_name = required.name
  );

  if v_missing is not null then
    raise exception
      'CRPE v6.25.1: tabela public.trainings nie ma wymaganych kolumn: %.',
      v_missing;
  end if;

  select data_type, udt_name
    into v_column
  from information_schema.columns
  where table_schema = 'public' and table_name = 'trainings' and column_name = 'id';
  if v_column.udt_name <> 'uuid' then
    raise exception 'CRPE v6.25.1: public.trainings.id musi mieć typ uuid, wykryto %.', v_column.udt_name;
  end if;

  -- Jeżeli kolumny są enumami, sprawdzamy wartości używane przez importer.
  for v_column in
    select column_name, data_type, udt_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'trainings'
      and column_name in ('delivery_format', 'category', 'approval_status')
  loop
    if v_column.data_type = 'USER-DEFINED' then
      v_required_labels := case v_column.column_name
        when 'delivery_format' then array['online', 'in_person', 'hybrid']
        when 'category' then array['szkolenie', 'warsztaty']
        else array['pending']
      end;

      select string_agg(label, ', ' order by label)
        into v_missing_labels
      from unnest(v_required_labels) label
      where not exists (
        select 1
        from pg_type type_info
        join pg_enum enum_info on enum_info.enumtypid = type_info.oid
        where type_info.typname = v_column.udt_name
          and enum_info.enumlabel = label
      );

      if v_missing_labels is not null then
        raise exception
          'CRPE v6.25.1: enum % dla kolumny % nie dopuszcza wartości: %.',
          v_column.udt_name, v_column.column_name, v_missing_labels;
      end if;
    end if;
  end loop;
end
$preflight$;

create table if not exists public.training_import_sources (
  code text primary key,
  name_pl text not null,
  base_url text not null,
  default_organizer_name text not null,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_import_sources_code_format
    check (code ~ '^[a-z0-9][a-z0-9_-]{1,49}$'),
  constraint training_import_sources_base_url_https
    check (base_url ~* '^https://')
);

insert into public.training_import_sources (
  code, name_pl, base_url, default_organizer_name, is_enabled
)
values (
  'nil', 'Naczelna Izba Lekarska', 'https://nil.org.pl',
  'Naczelna Izba Lekarska', true
)
on conflict (code) do update
set name_pl = excluded.name_pl,
    base_url = excluded.base_url,
    default_organizer_name = excluded.default_organizer_name;

create table if not exists public.training_importer_accounts (
  source_code text not null
    references public.training_import_sources(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (source_code, user_id)
);

alter table public.trainings
  add column if not exists import_source text,
  add column if not exists source_external_id text,
  add column if not exists source_url text,
  add column if not exists source_fetched_at timestamptz,
  add column if not exists source_payload_hash text,
  add column if not exists source_warnings text[] not null default '{}'::text[],
  add column if not exists imported_by uuid,
  add column if not exists schedule_status text not null default 'scheduled';

-- Katalog i formularze już obsługują null. Jest on konieczny dla ogłoszeń,
-- w których źródło prowadzi zapisy, ale termin zostanie dopiero ustalony.
alter table public.trainings alter column starts_on drop not null;

do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_import_source_fkey'
  ) then
    alter table public.trainings
      add constraint trainings_import_source_fkey
      foreign key (import_source)
      references public.training_import_sources(code) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_imported_by_fkey'
  ) then
    alter table public.trainings
      add constraint trainings_imported_by_fkey
      foreign key (imported_by)
      references auth.users(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_source_url_https'
  ) then
    alter table public.trainings
      add constraint trainings_source_url_https
      check (source_url is null or source_url ~* '^https://');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_source_payload_hash_format'
  ) then
    alter table public.trainings
      add constraint trainings_source_payload_hash_format
      check (source_payload_hash is null or source_payload_hash ~ '^[0-9a-f]{64}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_import_metadata_complete'
  ) then
    alter table public.trainings
      add constraint trainings_import_metadata_complete
      check (
        (import_source is null
          and source_external_id is null
          and source_url is null
          and source_fetched_at is null
          and source_payload_hash is null
          and imported_by is null)
        or
        (import_source is not null
          and source_external_id is not null
          and btrim(source_external_id) <> ''
          and source_url is not null
          and source_fetched_at is not null
          and source_payload_hash is not null
          and imported_by is not null)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_schedule_status_valid'
  ) then
    alter table public.trainings
      add constraint trainings_schedule_status_valid
      check (
        (schedule_status = 'scheduled' and starts_on is not null)
        or
        (schedule_status = 'to_be_determined'
          and starts_on is null and ends_on is null
          and start_time is null and end_time is null)
      ) not valid;
  end if;
end
$constraints$;

-- Dotychczasowe rekordy bez daty są jawnie oznaczane jako termin nieustalony.
update public.trainings
set schedule_status = 'to_be_determined'
where starts_on is null;

alter table public.trainings validate constraint trainings_schedule_status_valid;

create unique index if not exists trainings_import_identity_unique
  on public.trainings (import_source, source_external_id)
  where import_source is not null and source_external_id is not null;

create table if not exists public.training_import_changes (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings(id) on delete cascade,
  source_code text not null references public.training_import_sources(code) on delete restrict,
  source_external_id text not null,
  payload jsonb not null,
  payload_hash text not null,
  changed_fields text[] not null,
  status text not null default 'pending',
  fetched_at timestamptz not null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_reason text,
  constraint training_import_changes_hash_format
    check (payload_hash ~ '^[0-9a-f]{64}$'),
  constraint training_import_changes_fields_nonempty
    check (cardinality(changed_fields) > 0),
  constraint training_import_changes_status_valid
    check (status in ('pending', 'applied', 'rejected', 'superseded'))
);

create unique index if not exists training_import_changes_one_pending
  on public.training_import_changes (training_id)
  where status = 'pending';

create index if not exists training_import_changes_status_created
  on public.training_import_changes (status, created_at desc);

alter table public.training_import_sources enable row level security;
alter table public.training_importer_accounts enable row level security;
alter table public.training_import_changes enable row level security;
revoke all on table public.training_import_sources from anon, authenticated;
revoke all on table public.training_importer_accounts from anon, authenticated;
revoke all on table public.training_import_changes from anon, authenticated;

-- Anon otrzymuje tylko informację potrzebną do wyświetlenia terminu.
grant select (schedule_status) on public.trainings to anon;

-- Snapshot pól, które mogą różnić się między źródłem a rekordem moderatora.
create or replace function public.training_import_snapshot(p_training_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $function$
  select jsonb_build_object(
    'title', training.title,
    'organizer', training.organizer_name,
    'points', training.points,
    'delivery_format', training.delivery_format,
    'schedule_status', training.schedule_status,
    'start_date', training.starts_on,
    'end_date', training.ends_on,
    'start_time', case when training.start_time is null then null else to_char(training.start_time, 'HH24:MI') end,
    'end_time', case when training.end_time is null then null else to_char(training.end_time, 'HH24:MI') end,
    'time_zone', training.time_zone,
    'speakers', to_jsonb(coalesce(training.speakers, '{}'::text[])),
    'category', training.category,
    'profession_codes', coalesce((
      select jsonb_agg(profession.code order by profession.code)
      from public.training_profession_rules rule
      join public.professions profession on profession.id = rule.profession_id
      where rule.training_id = training.id
    ), '[]'::jsonb),
    'voivodeship', training.location,
    'external_url', training.external_url,
    'topics', to_jsonb(coalesce(training.topics, '{}'::text[])),
    'price_pln', training.price_pln,
    'has_recording', training.has_recording,
    'capacity', training.capacity,
    'enrollment_status', training.enrollment_status,
    'description', training.description
  )
  from public.trainings training
  where training.id = p_training_id;
$function$;

revoke all on function public.training_import_snapshot(uuid) from public;

-- Jedyna ścieżka zapisu dla kont importerów. Nowe szkolenie powstaje jako
-- pending, ale zmiana istniejącego rekordu trafia do osobnej kolejki i nie
-- nadpisuje pracy moderatora.
create or replace function public.import_training_from_source(
  p_source_code text,
  p_payload jsonb,
  p_payload_hash text,
  p_dry_run boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_external_id text := btrim(p_payload ->> 'source_external_id');
  v_training_id uuid;
  v_existing_hash text;
  v_profession_codes text[];
  v_expected_professions integer;
  v_inserted_professions integer;
  v_target_text text;
  v_current_snapshot jsonb;
  v_source_snapshot jsonb;
  v_changed_fields text[];
  v_latest_change_status text;
  v_latest_change_hash text;
  v_change_id uuid;
begin
  if v_user_id is null then raise exception 'Brak uprawnien importera.'; end if;

  if not exists (
    select 1 from public.training_import_sources source
    where source.code = p_source_code and source.is_enabled = true
  ) then
    if exists (select 1 from public.training_import_sources where code = p_source_code) then
      raise exception 'Zrodlo importu jest wylaczone.';
    end if;
    raise exception 'Nieznane zrodlo importu.';
  end if;

  if not exists (
    select 1 from public.training_importer_accounts account
    where account.source_code = p_source_code
      and account.user_id = v_user_id and account.is_active = true
  ) then
    raise exception 'Brak uprawnien importera dla tego zrodla.';
  end if;

  if v_external_id is null
     or char_length(v_external_id) not between 1 and 200
     or p_payload_hash !~ '^[0-9a-f]{64}$'
     or coalesce(p_payload ->> 'source_url', '') !~* '^https://'
     or coalesce(p_payload ->> 'external_url', '') !~* '^https://'
  then
    raise exception 'Nieprawidlowe metadane importu.';
  end if;

  if jsonb_typeof(p_payload -> 'profession_codes') <> 'array'
     or jsonb_typeof(p_payload -> 'source_warnings') <> 'array'
  then
    raise exception 'Nieprawidlowe tablice danych importu.';
  end if;

  if p_payload ->> 'schedule_status' = 'scheduled'
     and nullif(p_payload ->> 'start_date', '') is null
  then
    raise exception 'Zaplanowane szkolenie wymaga daty rozpoczecia.';
  end if;

  if p_payload ->> 'schedule_status' = 'to_be_determined'
     and (p_payload ->> 'start_date' is not null
       or p_payload ->> 'end_date' is not null
       or p_payload ->> 'start_time' is not null
       or p_payload ->> 'end_time' is not null)
  then
    raise exception 'Szkolenie bez ustalonego terminu nie moze miec dat ani godzin.';
  end if;

  select coalesce(array_agg(value order by value), '{}'::text[])
    into v_profession_codes
  from jsonb_array_elements_text(p_payload -> 'profession_codes') codes(value);

  v_expected_professions := cardinality(v_profession_codes);
  if v_expected_professions = 0 then raise exception 'Nieprawidlowe kody zawodow.'; end if;

  if (
    select count(*) from public.professions profession
    where profession.code = any(v_profession_codes) and profession.is_active = true
  ) <> v_expected_professions then
    raise exception 'Co najmniej jeden kod zawodu nie istnieje lub jest nieaktywny.';
  end if;

  select string_agg(profession.name_pl, ', ' order by profession.sort_order, profession.name_pl)
    into v_target_text
  from public.professions profession
  where profession.code = any(v_profession_codes) and profession.is_active = true;

  perform pg_advisory_xact_lock(hashtextextended(p_source_code || ':' || v_external_id, 6251));

  select training.id, training.source_payload_hash
    into v_training_id, v_existing_hash
  from public.trainings training
  where training.import_source = p_source_code
    and training.source_external_id = v_external_id
  for update;

  if v_training_id is not null and v_existing_hash = p_payload_hash then
    if not p_dry_run then
      update public.trainings
      set source_fetched_at = (p_payload ->> 'source_fetched_at')::timestamptz,
          source_warnings = coalesce(
            array(select jsonb_array_elements_text(p_payload -> 'source_warnings')),
            '{}'::text[]
          )
      where id = v_training_id;
    end if;
    return jsonb_build_object(
      'status', case when p_dry_run then 'would_be_unchanged' else 'unchanged' end,
      'training_id', v_training_id,
      'source_external_id', v_external_id
    );
  end if;

  if v_training_id is null then
    if p_dry_run then
      return jsonb_build_object(
        'status', 'would_create', 'training_id', null,
        'source_external_id', v_external_id
      );
    end if;

    insert into public.trainings (
      title, organizer_name, points, delivery_format, schedule_status,
      starts_on, ends_on, start_time, end_time, time_zone, speakers, category,
      target_profession_text, audience_scope, points_verification_status,
      points_source_url, points_verified_on, location, external_url, topics,
      price_pln, has_recording, capacity, enrollment_status, approval_status,
      submitted_by, submitted_email, description, import_source,
      source_external_id, source_url, source_fetched_at, source_payload_hash,
      source_warnings, imported_by
    )
    values (
      p_payload ->> 'title', p_payload ->> 'organizer',
      (p_payload ->> 'points')::numeric, p_payload ->> 'delivery_format',
      p_payload ->> 'schedule_status', (p_payload ->> 'start_date')::date,
      (p_payload ->> 'end_date')::date, (p_payload ->> 'start_time')::time,
      (p_payload ->> 'end_time')::time, p_payload ->> 'time_zone',
      coalesce(array(select jsonb_array_elements_text(p_payload -> 'speakers')), '{}'::text[]),
      p_payload ->> 'category', v_target_text, 'specific', 'unverified',
      p_payload ->> 'source_url', null, p_payload ->> 'voivodeship',
      p_payload ->> 'external_url',
      case when jsonb_array_length(p_payload -> 'topics') = 0 then null
        else array(select jsonb_array_elements_text(p_payload -> 'topics')) end,
      (p_payload ->> 'price_pln')::numeric,
      (p_payload ->> 'has_recording')::boolean,
      (p_payload ->> 'capacity')::integer,
      p_payload ->> 'enrollment_status', 'pending', v_user_id, null,
      p_payload ->> 'description', p_source_code, v_external_id,
      p_payload ->> 'source_url',
      (p_payload ->> 'source_fetched_at')::timestamptz, p_payload_hash,
      coalesce(array(select jsonb_array_elements_text(p_payload -> 'source_warnings')), '{}'::text[]),
      v_user_id
    )
    returning id into v_training_id;

    insert into public.training_profession_rules (
      training_id, profession_id, points, verification_status, source_url, verified_on
    )
    select v_training_id, profession.id, (p_payload ->> 'points')::numeric,
      'unverified', p_payload ->> 'source_url', null
    from public.professions profession
    where profession.code = any(v_profession_codes) and profession.is_active = true;

    get diagnostics v_inserted_professions = row_count;
    if v_inserted_professions <> v_expected_professions then
      raise exception 'Nie udalo sie zapisac wszystkich zawodow.';
    end if;

    return jsonb_build_object(
      'status', 'created', 'training_id', v_training_id,
      'source_external_id', v_external_id
    );
  end if;

  select change.status, change.payload_hash
    into v_latest_change_status, v_latest_change_hash
  from public.training_import_changes change
  where change.training_id = v_training_id
  order by change.created_at desc, change.id desc
  limit 1;

  if v_latest_change_hash = p_payload_hash then
    return jsonb_build_object(
      'status', case
        when p_dry_run and v_latest_change_status = 'pending' then 'would_be_change_pending'
        when p_dry_run and v_latest_change_status = 'rejected' then 'would_be_change_rejected'
        when v_latest_change_status = 'pending' then 'change_pending'
        when v_latest_change_status = 'rejected' then 'change_rejected'
        else 'unchanged'
      end,
      'training_id', v_training_id,
      'source_external_id', v_external_id
    );
  end if;

  v_current_snapshot := public.training_import_snapshot(v_training_id);
  v_source_snapshot := jsonb_build_object(
    'title', p_payload -> 'title',
    'organizer', p_payload -> 'organizer',
    'points', p_payload -> 'points',
    'delivery_format', p_payload -> 'delivery_format',
    'schedule_status', p_payload -> 'schedule_status',
    'start_date', p_payload -> 'start_date',
    'end_date', p_payload -> 'end_date',
    'start_time', p_payload -> 'start_time',
    'end_time', p_payload -> 'end_time',
    'time_zone', p_payload -> 'time_zone',
    'speakers', p_payload -> 'speakers',
    'category', p_payload -> 'category',
    'profession_codes', p_payload -> 'profession_codes',
    'voivodeship', p_payload -> 'voivodeship',
    'external_url', p_payload -> 'external_url',
    'topics', p_payload -> 'topics',
    'price_pln', p_payload -> 'price_pln',
    'has_recording', p_payload -> 'has_recording',
    'capacity', p_payload -> 'capacity',
    'enrollment_status', p_payload -> 'enrollment_status',
    'description', p_payload -> 'description'
  );

  select coalesce(array_agg(entry.key order by entry.key), '{}'::text[])
    into v_changed_fields
  from jsonb_each(v_source_snapshot) entry
  where v_current_snapshot -> entry.key is distinct from entry.value;

  -- Parser lub moderator mógł doprowadzić dane do tej samej postaci pomimo
  -- innego hasha. Uznajemy wtedy wersję źródła za przejrzaną bez kolejki.
  if cardinality(v_changed_fields) = 0 then
    if not p_dry_run then
      update public.trainings
      set source_payload_hash = p_payload_hash,
          source_fetched_at = (p_payload ->> 'source_fetched_at')::timestamptz,
          source_warnings = coalesce(
            array(select jsonb_array_elements_text(p_payload -> 'source_warnings')),
            '{}'::text[]
          )
      where id = v_training_id;
    end if;
    return jsonb_build_object(
      'status', case when p_dry_run then 'would_be_unchanged' else 'unchanged' end,
      'training_id', v_training_id,
      'source_external_id', v_external_id
    );
  end if;

  if p_dry_run then
    return jsonb_build_object(
      'status', 'would_queue_change',
      'training_id', v_training_id,
      'source_external_id', v_external_id,
      'changed_fields', to_jsonb(v_changed_fields)
    );
  end if;

  update public.training_import_changes
  set status = 'superseded', reviewed_at = now(),
      review_reason = 'Zastąpione nowszą wersją źródła.'
  where training_id = v_training_id and status = 'pending';

  insert into public.training_import_changes (
    training_id, source_code, source_external_id, payload, payload_hash,
    changed_fields, fetched_at
  )
  values (
    v_training_id, p_source_code, v_external_id, p_payload, p_payload_hash,
    v_changed_fields, (p_payload ->> 'source_fetched_at')::timestamptz
  )
  returning id into v_change_id;

  update public.trainings
  set source_fetched_at = (p_payload ->> 'source_fetched_at')::timestamptz,
      source_warnings = coalesce(
        array(select jsonb_array_elements_text(p_payload -> 'source_warnings')),
        '{}'::text[]
      )
  where id = v_training_id;

  return jsonb_build_object(
    'status', 'change_queued', 'training_id', v_training_id,
    'source_external_id', v_external_id, 'change_id', v_change_id,
    'changed_fields', to_jsonb(v_changed_fields)
  );
end
$function$;

revoke all on function public.import_training_from_source(text, jsonb, text, boolean) from public;
grant execute on function public.import_training_from_source(text, jsonb, text, boolean) to authenticated;

-- Panel administratora pobiera kolejkę przez RPC; tabela pozostaje całkowicie
-- niedostępna dla zwykłego użytkownika i klienta anonimowego.
create or replace function public.get_training_import_changes(
  p_status text default 'pending'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_result jsonb;
begin
  if not exists (
    select 1 from public.platform_staff_roles role
    where role.user_id = (select auth.uid())
      and role.role_code = 'platform_admin' and role.revoked_at is null
  ) then
    raise exception 'Brak uprawnien administratora.';
  end if;

  if p_status not in ('pending', 'applied', 'rejected', 'superseded', 'all') then
    raise exception 'Nieprawidlowy status kolejki importu.';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', change.id,
    'training_id', change.training_id,
    'source_code', change.source_code,
    'source_external_id', change.source_external_id,
    'status', change.status,
    'changed_fields', to_jsonb(change.changed_fields),
    'source', change.payload,
    'current', public.training_import_snapshot(change.training_id),
    'fetched_at', change.fetched_at,
    'created_at', change.created_at,
    'reviewed_at', change.reviewed_at,
    'review_reason', change.review_reason
  ) order by change.created_at desc), '[]'::jsonb)
  into v_result
  from public.training_import_changes change
  where p_status = 'all' or change.status = p_status;

  return v_result;
end
$function$;

revoke all on function public.get_training_import_changes(text) from public;
grant execute on function public.get_training_import_changes(text) to authenticated;

-- Moderator może zastosować wszystkie albo tylko wybrane pola. Pozostałe
-- ręczne poprawki zostają nietknięte. Po zastosowaniu rekord wraca do pending,
-- aby finalne zatwierdzenie było świadomym, osobnym krokiem.
create or replace function public.review_training_import_change(
  p_change_id uuid,
  p_decision text,
  p_fields text[] default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_change public.training_import_changes%rowtype;
  v_fields text[];
  v_profession_codes text[];
  v_target_text text;
  v_rule_points numeric;
  v_inserted integer;
begin
  if not exists (
    select 1 from public.platform_staff_roles role
    where role.user_id = v_user_id
      and role.role_code = 'platform_admin' and role.revoked_at is null
  ) then
    raise exception 'Brak uprawnien administratora.';
  end if;

  if p_decision not in ('apply', 'reject') then
    raise exception 'Nieprawidlowa decyzja moderatora.';
  end if;

  select * into v_change
  from public.training_import_changes change
  where change.id = p_change_id
  for update;

  if v_change.id is null then raise exception 'Nie znaleziono zmiany importu.'; end if;
  if v_change.status <> 'pending' then raise exception 'Zmiana importu zostala juz rozpatrzona.'; end if;

  perform 1 from public.trainings where id = v_change.training_id for update;

  if p_decision = 'reject' then
    update public.training_import_changes
    set status = 'rejected', reviewed_at = now(), reviewed_by = v_user_id,
        review_reason = nullif(btrim(p_reason), '')
    where id = p_change_id;

    return jsonb_build_object(
      'status', 'rejected', 'change_id', p_change_id,
      'training_id', v_change.training_id
    );
  end if;

  v_fields := coalesce(p_fields, v_change.changed_fields);
  select coalesce(array_agg(distinct field order by field), '{}'::text[])
    into v_fields from unnest(v_fields) field;

  if cardinality(v_fields) = 0 then raise exception 'Wybierz co najmniej jedno pole do zastosowania.'; end if;
  if exists (
    select 1 from unnest(v_fields) field
    where not (field = any(v_change.changed_fields))
  ) then
    raise exception 'Wybrano pole spoza zakresu zmiany.';
  end if;

  -- Pola terminu są grupą zależną. Jeśli zmienia się stan terminu, dołączamy
  -- wszystkie zmienione elementy tej grupy, aby nie utworzyć stanu sprzecznego.
  if v_fields && array['schedule_status', 'start_date', 'end_date', 'start_time', 'end_time'] then
    select array_agg(distinct field order by field) into v_fields
    from unnest(v_fields || v_change.changed_fields) field
    where field = any(v_fields)
       or field = any(array['schedule_status', 'start_date', 'end_date', 'start_time', 'end_time']);
  end if;

  update public.trainings
  set title = case when 'title' = any(v_fields) then v_change.payload ->> 'title' else title end,
      organizer_name = case when 'organizer' = any(v_fields) then v_change.payload ->> 'organizer' else organizer_name end,
      points = case when 'points' = any(v_fields) then (v_change.payload ->> 'points')::numeric else points end,
      delivery_format = case when 'delivery_format' = any(v_fields) then v_change.payload ->> 'delivery_format' else delivery_format end,
      schedule_status = case when 'schedule_status' = any(v_fields) then v_change.payload ->> 'schedule_status' else schedule_status end,
      starts_on = case when 'start_date' = any(v_fields) then (v_change.payload ->> 'start_date')::date else starts_on end,
      ends_on = case when 'end_date' = any(v_fields) then (v_change.payload ->> 'end_date')::date else ends_on end,
      start_time = case when 'start_time' = any(v_fields) then (v_change.payload ->> 'start_time')::time else start_time end,
      end_time = case when 'end_time' = any(v_fields) then (v_change.payload ->> 'end_time')::time else end_time end,
      time_zone = case when 'time_zone' = any(v_fields) then v_change.payload ->> 'time_zone' else time_zone end,
      speakers = case when 'speakers' = any(v_fields) then coalesce(array(select jsonb_array_elements_text(v_change.payload -> 'speakers')), '{}'::text[]) else speakers end,
      category = case when 'category' = any(v_fields) then v_change.payload ->> 'category' else category end,
      location = case when 'voivodeship' = any(v_fields) then v_change.payload ->> 'voivodeship' else location end,
      external_url = case when 'external_url' = any(v_fields) then v_change.payload ->> 'external_url' else external_url end,
      topics = case when 'topics' = any(v_fields) then case when jsonb_array_length(v_change.payload -> 'topics') = 0 then null else array(select jsonb_array_elements_text(v_change.payload -> 'topics')) end else topics end,
      price_pln = case when 'price_pln' = any(v_fields) then (v_change.payload ->> 'price_pln')::numeric else price_pln end,
      has_recording = case when 'has_recording' = any(v_fields) then (v_change.payload ->> 'has_recording')::boolean else has_recording end,
      capacity = case when 'capacity' = any(v_fields) then (v_change.payload ->> 'capacity')::integer else capacity end,
      enrollment_status = case when 'enrollment_status' = any(v_fields) then v_change.payload ->> 'enrollment_status' else enrollment_status end,
      description = case when 'description' = any(v_fields) then v_change.payload ->> 'description' else description end,
      approval_status = 'pending', approved_by = null, approved_at = null,
      reject_reason = null,
      source_url = v_change.payload ->> 'source_url',
      source_fetched_at = (v_change.payload ->> 'source_fetched_at')::timestamptz,
      source_payload_hash = v_change.payload_hash,
      source_warnings = coalesce(array(select jsonb_array_elements_text(v_change.payload -> 'source_warnings')), '{}'::text[])
  where id = v_change.training_id;

  if 'profession_codes' = any(v_fields) then
    select coalesce(array_agg(value order by value), '{}'::text[])
      into v_profession_codes
    from jsonb_array_elements_text(v_change.payload -> 'profession_codes') codes(value);

    select string_agg(profession.name_pl, ', ' order by profession.sort_order, profession.name_pl)
      into v_target_text
    from public.professions profession
    where profession.code = any(v_profession_codes) and profession.is_active = true;

    update public.trainings
    set target_profession_text = v_target_text, audience_scope = 'specific'
    where id = v_change.training_id;

    delete from public.training_profession_rules where training_id = v_change.training_id;
    select points into v_rule_points from public.trainings where id = v_change.training_id;

    insert into public.training_profession_rules (
      training_id, profession_id, points, verification_status, source_url, verified_on
    )
    select v_change.training_id, profession.id, v_rule_points, 'unverified',
      v_change.payload ->> 'source_url', null
    from public.professions profession
    where profession.code = any(v_profession_codes) and profession.is_active = true;

    get diagnostics v_inserted = row_count;
    if v_inserted <> cardinality(v_profession_codes) then
      raise exception 'Nie udalo sie zastosowac wszystkich zawodow.';
    end if;
  elsif 'points' = any(v_fields) then
    update public.training_profession_rules
    set points = (v_change.payload ->> 'points')::numeric,
        verification_status = 'unverified',
        source_url = v_change.payload ->> 'source_url', verified_on = null
    where training_id = v_change.training_id;
  end if;

  if 'points' = any(v_fields) then
    update public.trainings
    set points_verification_status = 'unverified',
        points_source_url = v_change.payload ->> 'source_url',
        points_verified_on = null
    where id = v_change.training_id;
  end if;

  update public.training_import_changes
  set status = 'applied', reviewed_at = now(), reviewed_by = v_user_id,
      review_reason = nullif(btrim(p_reason), '')
  where id = p_change_id;

  return jsonb_build_object(
    'status', 'applied', 'change_id', p_change_id,
    'training_id', v_change.training_id, 'applied_fields', to_jsonb(v_fields)
  );
end
$function$;

revoke all on function public.review_training_import_change(uuid, text, text[], text) from public;
grant execute on function public.review_training_import_change(uuid, text, text[], text) to authenticated;

grant select (
  import_source, source_external_id, source_url, source_fetched_at,
  source_payload_hash, source_warnings, imported_by, schedule_status
) on public.trainings to authenticated;

commit;

-- Kontrola po migracji. Każdy wiersz powinien mieć wynik OK.
with tests as (
  select 1 as lp, 'Źródło NIL jest aktywne'::text as test,
    exists (select 1 from public.training_import_sources where code = 'nil' and is_enabled) as ok
  union all
  select 2, 'Istnieje unikalna tożsamość importu',
    to_regclass('public.trainings_import_identity_unique') is not null
  union all
  select 3, 'Istnieje bezpieczna kolejka zmian',
    to_regclass('public.training_import_changes') is not null
  union all
  select 4, 'Istnieje funkcja atomowego importu',
    to_regprocedure('public.import_training_from_source(text,jsonb,text,boolean)') is not null
  union all
  select 5, 'Istnieje funkcja moderacji zmian',
    to_regprocedure('public.review_training_import_change(uuid,text,text[],text)') is not null
  union all
  select 6, 'Anon nie widzi kolejki zmian',
    not has_table_privilege('anon', 'public.training_import_changes', 'select')
  union all
  select 7, 'Authenticated nie zapisuje bezpośrednio kolejki',
    not has_table_privilege('authenticated', 'public.training_import_changes', 'insert')
  union all
  select 8, 'Obsługiwany jest termin do ustalenia',
    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trainings' and column_name = 'schedule_status')
)
select lp, test, case when ok then 'OK' else 'BŁĄD' end as wynik
from tests order by lp;
