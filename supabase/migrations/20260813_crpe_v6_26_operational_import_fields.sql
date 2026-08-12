-- CRPE v6.26 — kolejka zmian ze zrodla: stan zapisow przestaje blokowac publikacje.
--
-- Dwa problemy, ktore ta migracja zamyka:
--
-- 1. Kazde zastosowanie zmiany z importu ustawialo approval_status na 'pending'.
--    Przyjecie informacji „lista rezerwowa” zdejmowalo zaakceptowane szkolenie
--    z publicznej bazy do czasu ponownej akceptacji. Teraz zmiana obejmujaca
--    wylacznie pola operacyjne (enrollment_status, capacity) zostawia status.
--
-- 2. Null ze zrodla byl traktowany jak wartosc. Gdy parser nie rozpoznal stanu
--    zapisow (np. po zmianie szablonu strony NIL), do kolejki trafiala zmiana
--    „zapisy otwarte -> brak wartosci”. Teraz null przy znanej wartosci
--    obecnej jest pomijany w porownaniu.

begin;

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

  -- Null ze zrodla znaczy „parser nie rozpoznal”, a nie „tego nie ma”. Bez tej
  -- reguly jedna zmiana szablonu strony NIL zglaszalaby kolejke zmian, ktora
  -- kasuje znany stan zapisow i liczbe miejsc w calej bazie.
  if v_source_snapshot ->> 'enrollment_status' is null
     and v_current_snapshot ->> 'enrollment_status' is not null then
    v_source_snapshot := v_source_snapshot - 'enrollment_status';
  end if;

  if v_source_snapshot ->> 'capacity' is null
     and v_current_snapshot ->> 'capacity' is not null then
    v_source_snapshot := v_source_snapshot - 'capacity';
  end if;

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
  -- Pola czysto operacyjne. Zmiana samego stanu zapisow lub liczby miejsc
  -- nie zmienia tego, za co szkolenie daje punkty, wiec nie ma powodu
  -- cofac go do ponownej moderacji i zdejmowac z publicznej bazy.
  v_operational_fields constant text[] := array['enrollment_status', 'capacity'];
  v_operational_only boolean := false;
  v_remaining_fields text[] := '{}'::text[];
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

  v_operational_only := not exists (
    select 1 from unnest(v_fields) field
    where not (field = any(v_operational_fields))
  );

  -- Częściowe zastosowanie zmiany nie może „zgubić” pozostałych pól.
  -- To jest szczególnie ważne dla skrótu „Zaznacz tylko operacyjne”:
  -- stan zapisów możemy przyjąć od razu, ale np. nowa liczba punktów nadal
  -- musi pozostać w kolejce moderatora.
  select coalesce(array_agg(field order by field), '{}'::text[])
    into v_remaining_fields
  from unnest(v_change.changed_fields) field
  where not (field = any(v_fields));

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
      approval_status = case when v_operational_only then approval_status else 'pending' end,
      approved_by = case when v_operational_only then approved_by else null end,
      approved_at = case when v_operational_only then approved_at else null end,
      reject_reason = case when v_operational_only then reject_reason else null end,
      source_url = v_change.payload ->> 'source_url',
      source_fetched_at = (v_change.payload ->> 'source_fetched_at')::timestamptz,
      -- Pełny hash źródła zapisujemy dopiero po rozpatrzeniu wszystkich pól.
      -- Przy częściowym zastosowaniu ten sam payload ma nadal wracać jako
      -- oczekująca zmiana, a nie jako „unchanged”.
      source_payload_hash = case
        when cardinality(v_remaining_fields) = 0 then v_change.payload_hash
        else source_payload_hash
      end,
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

  if cardinality(v_remaining_fields) = 0 then
    update public.training_import_changes
    set status = 'applied', reviewed_at = now(), reviewed_by = v_user_id,
        review_reason = nullif(btrim(p_reason), '')
    where id = p_change_id;
  else
    -- Pozostałe pola zostają na tej samej, unikalnej pozycji pending.
    -- get_training_import_changes() pobiera bieżący snapshot szkolenia, więc
    -- moderator zobaczy już tylko nadal nierozstrzygnięte różnice.
    update public.training_import_changes
    set changed_fields = v_remaining_fields
    where id = p_change_id;
  end if;

  return jsonb_build_object(
    'status', case
      when cardinality(v_remaining_fields) = 0 then 'applied'
      else 'partially_applied'
    end,
    'change_id', p_change_id,
    'training_id', v_change.training_id,
    'applied_fields', to_jsonb(v_fields),
    'remaining_fields', to_jsonb(v_remaining_fields),
    'kept_approval', v_operational_only
  );
end
$function$;

-- Osobna, fail-safe ścieżka dla przycisku „Przyjmij zapisy”.
-- Frontend v6.26 wywołuje właśnie tę funkcję. Jeżeli migracja nie została
-- wykonana, RPC nie istnieje i kliknięcie kończy się błędem bez zmiany danych.
-- Funkcja dodatkowo odrzuca każdą zmianę zawierającą pole inne niż operacyjne.
create or replace function public.review_training_operational_import_change(
  p_change_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_change public.training_import_changes%rowtype;
  v_operational_fields constant text[] := array['enrollment_status', 'capacity'];
begin
  if not exists (
    select 1 from public.platform_staff_roles role
    where role.user_id = v_user_id
      and role.role_code = 'platform_admin' and role.revoked_at is null
  ) then
    raise exception 'Brak uprawnien administratora.';
  end if;

  select * into v_change
  from public.training_import_changes change
  where change.id = p_change_id;

  if v_change.id is null then raise exception 'Nie znaleziono zmiany importu.'; end if;
  if v_change.status <> 'pending' then raise exception 'Zmiana importu zostala juz rozpatrzona.'; end if;
  if cardinality(v_change.changed_fields) = 0
     or exists (
       select 1 from unnest(v_change.changed_fields) field
       where not (field = any(v_operational_fields))
     )
  then
    raise exception 'Zmiana nie jest czysto operacyjna.';
  end if;

  return public.review_training_import_change(
    p_change_id,
    'apply',
    v_change.changed_fields,
    'Zmiana operacyjna przyjeta jednym kliknieciem.'
  );
end
$function$;

revoke all on function public.import_training_from_source(text, jsonb, text, boolean) from public;
revoke all on function public.review_training_import_change(uuid, text, text[], text) from public;
revoke all on function public.review_training_operational_import_change(uuid) from public;
grant execute on function public.import_training_from_source(text, jsonb, text, boolean) to authenticated;
grant execute on function public.review_training_import_change(uuid, text, text[], text) to authenticated;
grant execute on function public.review_training_operational_import_change(uuid) to authenticated;

commit;

-- Kontrola po migracji. Kazdy wiersz powinien miec wynik OK.
with tests as (
  select 1 as lp, 'Funkcja importu istnieje'::text as test,
    to_regprocedure('public.import_training_from_source(text,jsonb,text,boolean)') is not null as ok
  union all
  select 2, 'Import pomija nierozpoznany stan zapisow',
    pg_get_functiondef(to_regprocedure('public.import_training_from_source(text,jsonb,text,boolean)')::oid)
      like '%v_source_snapshot - ''enrollment_status''%'
  union all
  select 3, 'Funkcja moderacji rozpoznaje pola operacyjne',
    pg_get_functiondef(to_regprocedure('public.review_training_import_change(uuid,text,text[],text)')::oid)
      like '%v_operational_fields%'
  union all
  select 4, 'Status akceptacji jest warunkowy',
    pg_get_functiondef(to_regprocedure('public.review_training_import_change(uuid,text,text[],text)')::oid)
      like '%case when v_operational_only then approval_status%'
  union all
  select 5, 'Czesciowe zastosowanie zostawia pozostale pola w kolejce',
    pg_get_functiondef(to_regprocedure('public.review_training_import_change(uuid,text,text[],text)')::oid)
      like '%changed_fields = v_remaining_fields%'
  union all
  select 6, 'Hash zrodla czeka na rozpatrzenie wszystkich pol',
    pg_get_functiondef(to_regprocedure('public.review_training_import_change(uuid,text,text[],text)')::oid)
      like '%cardinality(v_remaining_fields) = 0 then v_change.payload_hash%'
  union all
  select 7, 'Istnieje bezpieczny RPC dla zmian operacyjnych',
    to_regprocedure('public.review_training_operational_import_change(uuid)') is not null
)
select lp, test, case when ok then 'OK' else 'BLAD' end as wynik
from tests order by lp;
