-- CRPE v5.2 — adresaci szkoleń i punktacja zależna od zawodu.
-- Uruchomić po migracji v5.1e. Skrypt jest idempotentny.

begin;

alter table public.trainings
  add column if not exists audience_scope text not null default 'unknown',
  add column if not exists credit_status text not null default 'unknown';

do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_audience_scope_check'
  ) then
    alter table public.trainings
      add constraint trainings_audience_scope_check
      check (audience_scope in ('all', 'selected', 'unknown'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_credit_status_check'
  ) then
    alter table public.trainings
      add constraint trainings_credit_status_check
      check (credit_status in ('unknown', 'none', 'awarded'));
  end if;
end
$constraints$;

create table if not exists public.training_target_professions (
  training_id uuid not null references public.trainings(id) on delete cascade,
  profession_id uuid not null references public.professions(id) on delete restrict,
  created_at timestamptz not null default current_timestamp,
  created_by uuid references auth.users(id) on delete set null,
  primary key (training_id, profession_id)
);

create table if not exists public.training_profession_credits (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings(id) on delete cascade,
  profession_id uuid not null references public.professions(id) on delete restrict,
  points numeric(8,2) not null check (points > 0),
  verification_status text not null default 'organizer_declared'
    check (verification_status in ('organizer_declared', 'operator_verified')),
  awarding_body text,
  basis_reference text,
  source_url text,
  created_at timestamptz not null default current_timestamp,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  unique (training_id, profession_id)
);

create index if not exists training_target_professions_profession_idx
  on public.training_target_professions(profession_id, training_id);

create index if not exists training_profession_credits_profession_idx
  on public.training_profession_credits(profession_id, training_id);

alter table public.training_target_professions enable row level security;
alter table public.training_profession_credits enable row level security;

grant select, insert, update, delete
  on public.training_target_professions to authenticated;
grant select, insert, update, delete
  on public.training_profession_credits to authenticated;

do $policies$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'training_target_professions'
      and policyname = 'training_target_professions_select_authenticated'
  ) then
    create policy training_target_professions_select_authenticated
      on public.training_target_professions for select to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'training_profession_credits'
      and policyname = 'training_profession_credits_select_authenticated'
  ) then
    create policy training_profession_credits_select_authenticated
      on public.training_profession_credits for select to authenticated
      using (true);
  end if;
end
$policies$;

alter policy training_target_professions_select_authenticated
  on public.training_target_professions
  using (
    exists (
      select 1 from public.trainings t
      where t.id = training_target_professions.training_id
    )
  );

alter policy training_profession_credits_select_authenticated
  on public.training_profession_credits
  using (
    exists (
      select 1 from public.trainings t
      where t.id = training_profession_credits.training_id
    )
  );

-- Jednoznaczne historyczne oznaczenia mapujemy do słownika. Używamy zamkniętej
-- listy, ponieważ samo wystąpienie fragmentu „ogóln” (np. w nazwie zawodu) nie
-- jest wystarczającym dowodem, że szkolenie jest dla wszystkich. Puste i inne
-- niejednoznaczne wartości pozostają unknown.
update public.trainings t
set audience_scope = 'all'
where t.audience_scope = 'unknown'
  and regexp_replace(
    lower(trim(coalesce(t.target_profession_text, ''))),
    '\s+',
    ' ',
    'g'
  ) in (
    'wszystkie',
    'wszyscy',
    'dla wszystkich',
    'wszystkie zawody',
    'wszystkie zawody medyczne',
    'ogólne',
    'ogólne / dla wszystkich',
    'ogólne/dla wszystkich'
  );

insert into public.training_target_professions(training_id, profession_id)
select t.id, p.id
from public.trainings t
join public.professions p
  on lower(trim(t.target_profession_text)) in (
    lower(trim(p.name_pl)),
    lower(trim(coalesce(p.name_pl_plural, ''))),
    lower(trim(p.code))
  )
where t.audience_scope = 'unknown'
  and nullif(trim(coalesce(t.target_profession_text, '')), '') is not null
on conflict (training_id, profession_id) do nothing;

update public.trainings t
set audience_scope = 'selected'
where t.audience_scope = 'unknown'
  and exists (
    select 1 from public.training_target_professions tp
    where tp.training_id = t.id
  );

-- Przy jednoznacznym pojedynczym zawodzie zachowujemy dodatnią historyczną
-- liczbę jako deklarację organizatora. Pozostała punktacja wymaga przeglądu.
insert into public.training_profession_credits(
  training_id, profession_id, points, verification_status
)
select t.id, tp.profession_id, t.points, 'organizer_declared'
from public.trainings t
join public.training_target_professions tp on tp.training_id = t.id
where t.audience_scope = 'selected'
  and t.credit_status = 'unknown'
  and t.points > 0
  and (select count(*) from public.training_target_professions x where x.training_id = t.id) = 1
on conflict (training_id, profession_id) do nothing;

update public.trainings t
set credit_status = 'awarded'
where t.credit_status = 'unknown'
  and exists (
    select 1 from public.training_profession_credits pc
    where pc.training_id = t.id
  );

create or replace function public.submit_training_v5_2(
  p_training jsonb,
  p_audience_scope text,
  p_profession_ids uuid[] default '{}'::uuid[],
  p_credit_status text default 'unknown',
  p_credits jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_training_id uuid;
  v_profession_id uuid;
  v_credit jsonb;
  v_points numeric;
begin
  if v_user_id is null then
    raise exception 'Wymagane jest zalogowanie.';
  end if;
  if jsonb_typeof(coalesce(p_training, '{}'::jsonb)) <> 'object' then
    raise exception 'Nieprawidłowe dane szkolenia.';
  end if;
  if jsonb_typeof(coalesce(p_credits, '[]'::jsonb)) <> 'array' then
    raise exception 'Nieprawidłowa lista punktacji.';
  end if;
  if (select count(*) from public.trainings where submitted_by = v_user_id and created_at >= current_timestamp - interval '1 hour') >= 10 then
    raise exception 'Osiągnięto limit 10 zgłoszeń na godzinę. Spróbuj później.';
  end if;
  if p_audience_scope not in ('all', 'selected') then
    raise exception 'Wybierz adresatów szkolenia.';
  end if;
  if p_audience_scope = 'selected' and coalesce(cardinality(p_profession_ids), 0) = 0 then
    raise exception 'Wybierz co najmniej jeden zawód.';
  end if;
  if p_credit_status not in ('unknown', 'none', 'awarded') then
    raise exception 'Wybierz status punktów.';
  end if;
  if p_credit_status = 'awarded' and jsonb_array_length(coalesce(p_credits, '[]'::jsonb)) = 0 then
    raise exception 'Dodaj punktację dla co najmniej jednego zawodu.';
  end if;
  if nullif(trim(p_training ->> 'title'), '') is null then
    raise exception 'Podaj tytuł szkolenia.';
  end if;
  if length(trim(p_training ->> 'title')) > 300 then
    raise exception 'Tytuł może mieć maksymalnie 300 znaków.';
  end if;
  if coalesce(cardinality(p_profession_ids), 0) > 50 or jsonb_array_length(coalesce(p_credits, '[]'::jsonb)) > 50 then
    raise exception 'Lista zawodów jest zbyt długa.';
  end if;
  if (
    select count(*) <> count(distinct x.id)
    from unnest(coalesce(p_profession_ids, '{}'::uuid[])) x(id)
  ) then
    raise exception 'Lista adresatów zawiera powtórzony zawód.';
  end if;
  if nullif(p_training ->> 'start_date', '') is null then
    raise exception 'Podaj datę rozpoczęcia.';
  end if;

  if exists (
    select 1 from unnest(coalesce(p_profession_ids, '{}'::uuid[])) x(id)
    left join public.professions p on p.id = x.id and p.is_active
    where p.id is null
  ) then
    raise exception 'Lista adresatów zawiera nieaktywny zawód.';
  end if;

  insert into public.trainings(
    title, organizer_name, points, delivery_format, starts_on, ends_on,
    category, target_profession_text, audience_scope, credit_status, location,
    external_url, is_partner, topics, price_pln, has_recording, capacity,
    enrollment_status, approval_status, submitted_by, submitted_email
  ) values (
    trim(p_training ->> 'title'),
    nullif(trim(p_training ->> 'organizer'), ''),
    null,
    case p_training ->> 'format'
      when 'stacjonarne' then 'in_person'
      when 'hybrydowe' then 'hybrid'
      else 'online'
    end,
    (p_training ->> 'start_date')::date,
    nullif(p_training ->> 'end_date', '')::date,
    nullif(p_training ->> 'category', ''),
    case when p_audience_scope = 'all' then 'Wszystkie zawody medyczne' else null end,
    p_audience_scope,
    p_credit_status,
    nullif(trim(p_training ->> 'voivodeship'), ''),
    nullif(trim(p_training ->> 'url'), ''),
    false,
    case when jsonb_typeof(p_training -> 'topics') = 'array'
      then array(select jsonb_array_elements_text(p_training -> 'topics'))
      else null end,
    nullif(p_training ->> 'price_pln', '')::numeric,
    coalesce((p_training ->> 'has_recording')::boolean, false),
    nullif(p_training ->> 'capacity', '')::integer,
    nullif(p_training ->> 'enrollment_status', ''),
    'pending',
    v_user_id,
    auth.jwt() ->> 'email'
  ) returning id into v_training_id;

  if p_audience_scope = 'selected' then
    insert into public.training_target_professions(training_id, profession_id, created_by)
    select v_training_id, x, v_user_id
    from unnest(p_profession_ids) x;

    update public.trainings t
    set target_profession_text = (
      select string_agg(coalesce(p.name_pl_plural, p.name_pl), ', ' order by p.sort_order, p.name_pl)
      from public.training_target_professions tp
      join public.professions p on p.id = tp.profession_id
      where tp.training_id = v_training_id
    )
    where t.id = v_training_id;
  end if;

  if p_credit_status = 'awarded' then
    for v_credit in select value from jsonb_array_elements(p_credits)
    loop
      v_profession_id := (v_credit ->> 'profession_id')::uuid;
      v_points := (v_credit ->> 'points')::numeric;
      if v_points <= 0 then raise exception 'Liczba punktów musi być większa od zera.'; end if;
      if not exists (select 1 from public.professions where id = v_profession_id and is_active) then
        raise exception 'Punktacja zawiera nieaktywny zawód.';
      end if;
      if p_audience_scope = 'selected' and not (v_profession_id = any(p_profession_ids)) then
        raise exception 'Punkty można przypisać tylko adresatom szkolenia.';
      end if;

      insert into public.training_profession_credits(
        training_id, profession_id, points, verification_status,
        awarding_body, basis_reference, source_url, created_by
      ) values (
        v_training_id, v_profession_id, v_points, 'organizer_declared',
        nullif(trim(v_credit ->> 'awarding_body'), ''),
        nullif(trim(v_credit ->> 'basis_reference'), ''),
        nullif(trim(v_credit ->> 'source_url'), ''),
        v_user_id
      );
    end loop;

    update public.trainings
    set points = (select max(points) from public.training_profession_credits where training_id = v_training_id)
    where id = v_training_id;
  elsif p_credit_status = 'none' then
    update public.trainings set points = 0 where id = v_training_id;
  end if;

  return v_training_id;
end
$function$;

create or replace function public.enforce_training_approval_classification_v5_2()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $trigger$
begin
  if new.approval_status = 'approved' then
    if new.audience_scope = 'unknown' then
      raise exception 'Przed akceptacją ustal adresatów szkolenia.';
    end if;
    if new.audience_scope = 'selected' and not exists (
      select 1 from public.training_target_professions tp where tp.training_id = new.id
    ) then
      raise exception 'Przed akceptacją wybierz co najmniej jeden zawód.';
    end if;
    if new.credit_status = 'unknown' then
      raise exception 'Przed akceptacją ustal status punktów.';
    end if;
    if new.credit_status = 'awarded' and not exists (
      select 1 from public.training_profession_credits pc where pc.training_id = new.id
    ) then
      raise exception 'Przed akceptacją uzupełnij punktację.';
    end if;
  end if;
  return new;
end
$trigger$;

drop trigger if exists trainings_enforce_classification_v5_2 on public.trainings;
create trigger trainings_enforce_classification_v5_2
before insert or update of approval_status, audience_scope, credit_status
on public.trainings
for each row execute function public.enforce_training_approval_classification_v5_2();

create or replace function public.admin_set_training_classification_v5_2(
  p_training_id uuid,
  p_audience_scope text,
  p_profession_ids uuid[] default '{}'::uuid[],
  p_credit_status text default 'unknown',
  p_credits jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_credit jsonb;
  v_profession_id uuid;
  v_points numeric;
  v_target_text text;
  v_derived_points numeric;
begin
  if v_user_id is null or not exists (
    select 1 from public.platform_staff_roles
    where user_id = v_user_id and role_code = 'platform_admin' and revoked_at is null
  ) then
    raise exception 'Brak uprawnień operatora.';
  end if;
  if not exists (select 1 from public.trainings where id = p_training_id) then
    raise exception 'Nie znaleziono szkolenia.';
  end if;
  if jsonb_typeof(coalesce(p_credits, '[]'::jsonb)) <> 'array' then
    raise exception 'Nieprawidłowa lista punktacji.';
  end if;
  if p_audience_scope not in ('all', 'selected', 'unknown') then raise exception 'Nieprawidłowy zakres adresatów.'; end if;
  if p_audience_scope = 'selected' and coalesce(cardinality(p_profession_ids), 0) = 0 then raise exception 'Wybierz zawód.'; end if;
  if p_credit_status not in ('unknown', 'none', 'awarded') then raise exception 'Nieprawidłowy status punktów.'; end if;
  if p_credit_status = 'awarded' and jsonb_array_length(coalesce(p_credits, '[]'::jsonb)) = 0 then raise exception 'Dodaj punktację.'; end if;
  if coalesce(cardinality(p_profession_ids), 0) > 50 or jsonb_array_length(coalesce(p_credits, '[]'::jsonb)) > 50 then raise exception 'Lista zawodów jest zbyt długa.'; end if;
  if (
    select count(*) <> count(distinct x.id)
    from unnest(coalesce(p_profession_ids, '{}'::uuid[])) x(id)
  ) then
    raise exception 'Lista adresatów zawiera powtórzony zawód.';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_profession_ids, '{}'::uuid[])) x(id)
    left join public.professions p on p.id = x.id and p.is_active
    where p.id is null
  ) then
    raise exception 'Lista adresatów zawiera nieaktywny zawód.';
  end if;

  delete from public.training_target_professions where training_id = p_training_id;
  delete from public.training_profession_credits where training_id = p_training_id;

  if p_audience_scope = 'selected' then
    insert into public.training_target_professions(training_id, profession_id, created_by)
    select p_training_id, x, v_user_id from unnest(p_profession_ids) x;
    select string_agg(coalesce(p.name_pl_plural, p.name_pl), ', ' order by p.sort_order, p.name_pl)
      into v_target_text
    from public.training_target_professions tp
    join public.professions p on p.id = tp.profession_id
    where tp.training_id = p_training_id;
  elsif p_audience_scope = 'all' then
    v_target_text := 'Wszystkie zawody medyczne';
  else
    v_target_text := null;
  end if;

  if p_credit_status = 'awarded' then
    for v_credit in select value from jsonb_array_elements(p_credits)
    loop
      v_profession_id := (v_credit ->> 'profession_id')::uuid;
      v_points := (v_credit ->> 'points')::numeric;
      if v_points <= 0 then raise exception 'Liczba punktów musi być większa od zera.'; end if;
      if not exists (select 1 from public.professions where id = v_profession_id and is_active) then raise exception 'Punktacja zawiera nieaktywny zawód.'; end if;
      if p_audience_scope = 'selected' and not (v_profession_id = any(p_profession_ids)) then raise exception 'Punkty poza listą adresatów.'; end if;
      insert into public.training_profession_credits(
        training_id, profession_id, points, verification_status,
        awarding_body, basis_reference, source_url, created_by, reviewed_at, reviewed_by
      ) values (
        p_training_id, v_profession_id, v_points,
        'operator_verified',
        nullif(trim(v_credit ->> 'awarding_body'), ''),
        nullif(trim(v_credit ->> 'basis_reference'), ''),
        nullif(trim(v_credit ->> 'source_url'), ''),
        v_user_id, current_timestamp, v_user_id
      );
    end loop;
    select max(points) into v_derived_points from public.training_profession_credits where training_id = p_training_id;
  elsif p_credit_status = 'none' then
    v_derived_points := 0;
  else
    v_derived_points := null;
  end if;

  update public.trainings
  set audience_scope = p_audience_scope,
      credit_status = p_credit_status,
      target_profession_text = v_target_text,
      points = v_derived_points,
      updated_at = current_timestamp
  where id = p_training_id;

  return jsonb_build_object('points', v_derived_points, 'target_profession_text', v_target_text);
end
$function$;

revoke all on function public.submit_training_v5_2(jsonb,text,uuid[],text,jsonb) from public;
grant execute on function public.submit_training_v5_2(jsonb,text,uuid[],text,jsonb) to authenticated;
revoke all on function public.admin_set_training_classification_v5_2(uuid,text,uuid[],text,jsonb) from public;
grant execute on function public.admin_set_training_classification_v5_2(uuid,text,uuid[],text,jsonb) to authenticated;

commit;

-- Kontrola: każdy wiersz powinien zwrócić OK.
with tests(lp, test, expected, actual) as (
  values
    (1, 'Kolumna audience_scope', 1::bigint, (select count(*) from information_schema.columns where table_schema='public' and table_name='trainings' and column_name='audience_scope')),
    (2, 'Tabela adresatów', 1::bigint, (select count(*) from information_schema.tables where table_schema='public' and table_name='training_target_professions')),
    (3, 'Tabela punktacji zawodowej', 1::bigint, (select count(*) from information_schema.tables where table_schema='public' and table_name='training_profession_credits')),
    (4, 'Puste dane nie są oznaczone jako dla wszystkich', 0::bigint, (select count(*) from public.trainings where audience_scope='all' and nullif(trim(coalesce(target_profession_text,'')), '') is null)),
    (5, 'Selected ma zawód', 0::bigint, (select count(*) from public.trainings t where audience_scope='selected' and not exists (select 1 from public.training_target_professions tp where tp.training_id=t.id))),
    (6, 'Awarded ma punktację', 0::bigint, (select count(*) from public.trainings t where credit_status='awarded' and not exists (select 1 from public.training_profession_credits pc where pc.training_id=t.id))),
    (7, 'RPC zgłoszenia', 1::bigint, (select count(*) from pg_proc where proname='submit_training_v5_2')),
    (8, 'RPC operatora', 1::bigint, (select count(*) from pg_proc where proname='admin_set_training_classification_v5_2'))
)
select test, expected as oczekiwano, actual as znaleziono,
  case when expected=actual then 'OK' else 'BŁĄD' end as wynik
from tests order by lp;
