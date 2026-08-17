-- CRPE v6.27.11 — NIL: opis ze strony szczegółowej + ochrona ręcznej redakcji.
--
-- 1. Null opisu ze źródła nie może kasować istniejącego opisu CRPE ani tworzyć
--    fałszywej zmiany moderacyjnej.
-- 2. Czyścimy już oczekujące fałszywe zmiany description -> null.
--    Jeśli zmiana zawiera też inne pola, usuwamy tylko description z kolejki.

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

  -- Opis działa jak dane rozpoznawane przez parser: brak wartości w payloadzie
  -- nie oznacza polecenia usunięcia ręcznie zredagowanego opisu w CRPE.
  if v_source_snapshot ->> 'description' is null
     and v_current_snapshot ->> 'description' is not null then
    v_source_snapshot := v_source_snapshot - 'description';
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


-- Napraw kolejkę utworzoną przed v6.27.11.
update public.training_import_changes change
set changed_fields = array_remove(change.changed_fields, 'description')
from public.trainings training
where change.training_id = training.id
  and change.status = 'pending'
  and 'description' = any(change.changed_fields)
  and change.payload ->> 'description' is null
  and training.description is not null
  and cardinality(change.changed_fields) > 1;

update public.training_import_changes change
set status = 'superseded',
    reviewed_at = now(),
    review_reason = 'Automatycznie zamknięte w v6.27.11: brak opisu w payloadzie importera nie oznacza usunięcia istniejącego opisu CRPE.'
from public.trainings training
where change.training_id = training.id
  and change.status = 'pending'
  and change.changed_fields = array['description']::text[]
  and change.payload ->> 'description' is null
  and training.description is not null;

commit;
