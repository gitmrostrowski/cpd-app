-- CRPE v6.3: wiarygodne powiazanie szkolenie -> zawod -> punkty.
--
-- Wersja zgodna z zabezpieczeniem v5.2 obecnym w bazie Frankfurt.
-- v5.2 uzywalo innych nazw stanow i dwoch starszych tabel. Ta migracja:
--   * zachowuje stare kolumny i tabele (niczego nie usuwa),
--   * przenosi istniejace powiazania, jezeli sa obecne,
--   * zastepuje konfliktujacy trigger v5.2 zabezpieczeniem v6.3,
--   * nie zgaduje adresatow historycznych szkolen.
-- Skrypt jest transakcyjny i mozna go uruchomic ponownie.

begin;

-- Trigger v5.2 sprawdzal legacy `credit_status` i tabele
-- `training_target_professions` / `training_profession_credits`. Kod v6.3
-- zapisuje klasyfikacje w jednym, spojnym modelu ponizej, dlatego stary trigger
-- musi zostac zastapiony. Funkcja i stare dane pozostaja w bazie.
drop trigger if exists trainings_enforce_classification_v5_2
  on public.trainings;

-- v5.2 moglo zalozyc CHECK z wartosciami `selected` / `all`. Usuwamy tylko
-- ograniczenia CHECK odwolujace sie do audience_scope, po czym zakladamy jedno
-- ograniczenie zgodne z v6.3. Inne ograniczenia tabeli pozostaja bez zmian.
do $legacy_audience_constraints$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%audience_scope%'
  loop
    execute format(
      'alter table public.trainings drop constraint %I',
      v_constraint.conname
    );
  end loop;
end
$legacy_audience_constraints$;

alter table public.trainings
  add column if not exists audience_scope text not null default 'unknown',
  add column if not exists points_verification_status text not null default 'unverified',
  add column if not exists points_source_url text,
  add column if not exists points_verified_on date;

-- Normalizacja wartosci pozostawionych przez v5.2. Nie rozszerzamy nieznanych
-- rekordow na wszystkich medykow.
update public.trainings
set audience_scope = case
  when audience_scope in ('specific', 'selected') then 'specific'
  when audience_scope in ('all_medical', 'all') then 'all_medical'
  else 'unknown'
end
where audience_scope not in ('unknown', 'specific', 'all_medical');

do $constraints$
begin
  alter table public.trainings
    add constraint trainings_audience_scope_check
    check (audience_scope in ('unknown', 'specific', 'all_medical'));

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_points_verification_status_check'
  ) then
    alter table public.trainings
      add constraint trainings_points_verification_status_check
      check (points_verification_status in (
        'unverified',
        'organizer_declared',
        'verified'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_points_source_url_https'
  ) then
    alter table public.trainings
      add constraint trainings_points_source_url_https
      check (points_source_url is null or points_source_url ~* '^https://');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_verified_points_complete'
  ) then
    alter table public.trainings
      add constraint trainings_verified_points_complete
      check (
        points_verification_status <> 'verified'
        or (points_source_url is not null and points_verified_on is not null)
      );
  end if;
end
$constraints$;

create table if not exists public.training_profession_rules (
  training_id uuid not null
    references public.trainings(id) on delete cascade,
  profession_id uuid not null
    references public.professions(id) on delete restrict,
  points numeric check (points is null or points >= 0),
  verification_status text not null default 'unverified'
    check (verification_status in (
      'unverified',
      'organizer_declared',
      'verified'
    )),
  source_url text,
  verified_on date,
  note_pl text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (training_id, profession_id),
  constraint training_profession_rules_source_url_https
    check (source_url is null or source_url ~* '^https://'),
  constraint training_profession_rules_verified_complete
    check (
      verification_status <> 'verified'
      or (source_url is not null and verified_on is not null)
    )
);

create index if not exists training_profession_rules_profession_idx
  on public.training_profession_rules (profession_id, training_id);

do $trigger$
begin
  if to_regprocedure('public.set_updated_at()') is not null
     and not exists (
       select 1 from pg_trigger
       where tgname = 'training_profession_rules_set_updated_at'
         and tgrelid = 'public.training_profession_rules'::regclass
         and not tgisinternal
     )
  then
    execute '
      create trigger training_profession_rules_set_updated_at
      before update on public.training_profession_rules
      for each row execute function public.set_updated_at()
    ';
  end if;
end
$trigger$;

-- Jezeli v5.2 ma juz zapisane relacje szkolenie-zawod, kopiujemy je bez
-- zgadywania. Warunki po information_schema sprawiaja, ze migracja dziala tez
-- w bazie, w ktorej starszych tabel nigdy nie bylo.
do $legacy_targets$
begin
  if to_regclass('public.training_target_professions') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'training_target_professions'
         and column_name = 'training_id'
     )
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'training_target_professions'
         and column_name = 'profession_id'
     )
  then
    execute $copy_targets$
      insert into public.training_profession_rules (
        training_id,
        profession_id,
        points,
        verification_status
      )
      select
        tp.training_id,
        tp.profession_id,
        t.points,
        'unverified'
      from public.training_target_professions tp
      join public.trainings t on t.id = tp.training_id
      join public.professions p on p.id = tp.profession_id
      on conflict (training_id, profession_id) do nothing
    $copy_targets$;
  end if;
end
$legacy_targets$;

-- Jezeli v5.2 ma punktacje per zawod w standardowych kolumnach, zachowujemy
-- jej liczbe. Status pozostaje unverified, dopoki administrator nie doda
-- zrodla i daty sprawdzenia.
do $legacy_credits$
begin
  if to_regclass('public.training_profession_credits') is not null
     and not exists (
       select required.column_name
       from (values ('training_id'), ('profession_id'), ('points'))
         as required(column_name)
       where not exists (
         select 1
         from information_schema.columns c
         where c.table_schema = 'public'
           and c.table_name = 'training_profession_credits'
           and c.column_name = required.column_name
       )
     )
  then
    execute $copy_credits$
      insert into public.training_profession_rules (
        training_id,
        profession_id,
        points,
        verification_status
      )
      select
        pc.training_id,
        pc.profession_id,
        pc.points,
        'unverified'
      from public.training_profession_credits pc
      join public.trainings t on t.id = pc.training_id
      join public.professions p on p.id = pc.profession_id
      on conflict (training_id, profession_id) do update
      set points = excluded.points
    $copy_credits$;
  end if;
end
$legacy_credits$;

-- Domykamy ewentualna klasyfikacje przejeta z v5.2. Zakres specific bez
-- relacji wraca do unknown; przy poprawnej relacji uzupelniamy czytelny tekst
-- z katalogu zawodow. Dzieki temu nie powstaje stan posredni ani fikcyjne
-- dopasowanie do wszystkich profesji.
update public.trainings t
set audience_scope = 'unknown'
where t.audience_scope = 'specific'
  and not exists (
    select 1
    from public.training_profession_rules tpr
    where tpr.training_id = t.id
  );

update public.trainings t
set target_profession_text = (
  select string_agg(p.name_pl, ', ' order by p.sort_order, p.name_pl)
  from public.training_profession_rules tpr
  join public.professions p on p.id = tpr.profession_id
  where tpr.training_id = t.id
)
where t.audience_scope = 'specific'
  and (t.target_profession_text is null or btrim(t.target_profession_text) = '');

update public.trainings
set target_profession_text = 'Wszyscy medycy'
where audience_scope = 'all_medical'
  and (target_profession_text is null or btrim(target_profession_text) = '');

-- Rekordy bez danych o adresatach pozostaja swiadomie niezweryfikowane.
-- Brak danych nigdy nie oznacza "dla wszystkich".

-- Jedyny rekord z eksportu 07.08.2026, ktory jawnie wskazuje lekarzy i
-- lekarzy dentystow. Najpierw zapisujemy relacje, dopiero potem klasyfikacje
-- rekordu nadrzednego. Status organizer_declared nie udaje weryfikacji CRPE.
with explicit_training as (
  select id, points, external_url
  from public.trainings
  where id = 'dd728f4f-c5e4-4377-9d49-9033771a2301'::uuid
    and lower(coalesce(target_profession_text, '')) like '%lekarz%'
), selected_professions as (
  select id, code
  from public.professions
  where code in ('doctor', 'dentist')
    and is_active = true
)
insert into public.training_profession_rules (
  training_id,
  profession_id,
  points,
  verification_status,
  source_url
)
select
  et.id,
  sp.id,
  et.points,
  'organizer_declared',
  et.external_url
from explicit_training et
cross join selected_professions sp
on conflict (training_id, profession_id) do update
set points = excluded.points,
    verification_status = excluded.verification_status,
    source_url = excluded.source_url;

update public.trainings
set audience_scope = 'specific',
    points_verification_status = 'organizer_declared',
    points_source_url = coalesce(points_source_url, external_url)
where id = 'dd728f4f-c5e4-4377-9d49-9033771a2301'::uuid
  and lower(coalesce(target_profession_text, '')) like '%lekarz%';

-- Nowe zabezpieczenie odwoluje sie wylacznie do modelu v6.3. Historyczne
-- rekordy pozostaja widoczne, ale kazda nowa akceptacja wymaga ustalenia
-- adresatow, a zakres specific wymaga co najmniej jednej relacji.
create or replace function public.enforce_training_approval_classification_v6_3()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if new.approval_status = 'approved' then
    if new.audience_scope = 'unknown' then
      raise exception 'Przed akceptacja ustal adresatow szkolenia.';
    end if;

    if new.audience_scope = 'specific' and not exists (
      select 1
      from public.training_profession_rules tpr
      where tpr.training_id = new.id
    ) then
      raise exception 'Przed akceptacja wybierz co najmniej jeden zawod.';
    end if;
  end if;

  return new;
end
$function$;

drop trigger if exists trainings_enforce_classification_v6_3
  on public.trainings;
create trigger trainings_enforce_classification_v6_3
before insert or update of approval_status, audience_scope,
  points_verification_status
on public.trainings
for each row
execute function public.enforce_training_approval_classification_v6_3();

alter table public.training_profession_rules enable row level security;

drop policy if exists training_profession_rules_public_select
  on public.training_profession_rules;
create policy training_profession_rules_public_select
on public.training_profession_rules
for select
to anon
using (
  exists (
    select 1
    from public.trainings t
    where t.id = training_id
      and t.approval_status = 'approved'
  )
);

drop policy if exists training_profession_rules_authenticated_select
  on public.training_profession_rules;
create policy training_profession_rules_authenticated_select
on public.training_profession_rules
for select
to authenticated
using (
  exists (
    select 1
    from public.trainings t
    where t.id = training_id
      and (
        t.approval_status = 'approved'
        or t.submitted_by = (select auth.uid())
        or exists (
          select 1
          from public.platform_staff_roles psr
          where psr.user_id = (select auth.uid())
            and psr.role_code = 'platform_admin'
            and psr.revoked_at is null
        )
      )
  )
);

drop policy if exists training_profession_rules_submitter_insert
  on public.training_profession_rules;
create policy training_profession_rules_submitter_insert
on public.training_profession_rules
for insert
to authenticated
with check (
  exists (
    select 1
    from public.trainings t
    where t.id = training_id
      and t.submitted_by = (select auth.uid())
      and t.approval_status = 'pending'
  )
);

-- Jedna funkcja atomowo zastepuje powiazania podczas moderacji. Relacje sa
-- zapisywane przed aktualizacja rekordu nadrzednego, wiec trigger v6.3 widzi
-- kompletny stan przy akceptacji.
create or replace function public.replace_training_profession_rules(
  p_training_id uuid,
  p_audience_scope text,
  p_profession_codes text[],
  p_points numeric,
  p_verification_status text,
  p_source_url text,
  p_verified_on date
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_expected integer;
  v_inserted integer;
begin
  if not exists (
    select 1
    from public.platform_staff_roles psr
    where psr.user_id = (select auth.uid())
      and psr.role_code = 'platform_admin'
      and psr.revoked_at is null
  ) then
    raise exception 'Brak uprawnien administratora platformy.';
  end if;

  if p_audience_scope not in ('unknown', 'specific', 'all_medical') then
    raise exception 'Nieprawidlowy zakres adresatow.';
  end if;

  if p_verification_status not in (
    'unverified', 'organizer_declared', 'verified'
  ) then
    raise exception 'Nieprawidlowy status weryfikacji punktow.';
  end if;

  if p_verification_status = 'verified'
     and (p_source_url is null or p_verified_on is null) then
    raise exception 'Weryfikacja wymaga zrodla i daty sprawdzenia.';
  end if;

  if not exists (
    select 1 from public.trainings where id = p_training_id
  ) then
    raise exception 'Nie znaleziono szkolenia.';
  end if;

  v_expected := coalesce(cardinality(p_profession_codes), 0);
  if p_audience_scope = 'specific' and v_expected = 0 then
    raise exception 'Wybierz co najmniej jeden zawod.';
  end if;

  if p_audience_scope <> 'specific' and v_expected <> 0 then
    raise exception 'Kody zawodow sa dozwolone tylko dla zakresu specific.';
  end if;

  delete from public.training_profession_rules
  where training_id = p_training_id;

  if p_audience_scope = 'specific' then
    insert into public.training_profession_rules (
      training_id,
      profession_id,
      points,
      verification_status,
      source_url,
      verified_on
    )
    select
      p_training_id,
      p.id,
      p_points,
      p_verification_status,
      p_source_url,
      p_verified_on
    from public.professions p
    where p.code = any(p_profession_codes)
      and p.is_active = true;

    get diagnostics v_inserted = row_count;
    if v_inserted <> v_expected then
      raise exception 'Co najmniej jeden kod zawodu nie istnieje lub jest nieaktywny.';
    end if;
  end if;

  update public.trainings
  set audience_scope = p_audience_scope,
      target_profession_text = case
        when p_audience_scope = 'all_medical' then 'Wszyscy medycy'
        when p_audience_scope = 'unknown' then null
        else (
          select string_agg(p.name_pl, ', ' order by p.sort_order, p.name_pl)
          from public.professions p
          where p.code = any(p_profession_codes)
        )
      end,
      points_verification_status = p_verification_status,
      points_source_url = p_source_url,
      points_verified_on = p_verified_on
  where id = p_training_id;
end
$function$;

revoke all on function public.replace_training_profession_rules(
  uuid, text, text[], numeric, text, text, date
) from public;
grant execute on function public.replace_training_profession_rules(
  uuid, text, text[], numeric, text, text, date
) to authenticated;

grant select (
  training_id,
  profession_id,
  points,
  verification_status,
  source_url,
  verified_on,
  note_pl
) on public.training_profession_rules to anon, authenticated;

grant insert (
  training_id,
  profession_id,
  points,
  verification_status,
  source_url,
  verified_on,
  note_pl
) on public.training_profession_rules to authenticated;

grant select, insert, update, delete
on public.training_profession_rules to service_role;

grant select (
  audience_scope,
  points_verification_status,
  points_source_url,
  points_verified_on
) on public.trainings to anon;

grant select, update (
  audience_scope,
  points_verification_status,
  points_source_url,
  points_verified_on
) on public.trainings to authenticated;

commit;

-- Kontrola po wykonaniu. Kazdy z 5 wierszy powinien miec wynik OK.
with tests as (
  select 1 as lp,
    'v5.2 zastapione zabezpieczeniem v6.3'::text as test,
    not exists (
      select 1 from pg_trigger
      where tgname = 'trainings_enforce_classification_v5_2'
        and tgrelid = 'public.trainings'::regclass
        and not tgisinternal
    )
    and exists (
      select 1 from pg_trigger
      where tgname = 'trainings_enforce_classification_v6_3'
        and tgrelid = 'public.trainings'::regclass
        and not tgisinternal
    ) as ok
  union all
  select 2,
    'Istnieje tabela relacji szkolenie-zawod',
    to_regclass('public.training_profession_rules') is not null
  union all
  select 3,
    'Brak adresatow nie oznacza wszystkich',
    not exists (
      select 1 from public.trainings
      where (target_profession_text is null or btrim(target_profession_text) = '')
        and audience_scope <> 'unknown'
    )
  union all
  select 4,
    'Jawny rekord ma lekarza i lekarza dentyste',
    (
      select count(*) = 2
      from public.training_profession_rules tpr
      join public.professions p on p.id = tpr.profession_id
      where tpr.training_id = 'dd728f4f-c5e4-4377-9d49-9033771a2301'::uuid
        and p.code in ('doctor', 'dentist')
    )
  union all
  select 5,
    'Nie ma fikcyjnie zweryfikowanych punktow',
    not exists (
      select 1 from public.trainings
      where points_verification_status = 'verified'
        and (points_source_url is null or points_verified_on is null)
    )
)
select lp, test, case when ok then 'OK' else 'BLAD' end as wynik
from tests
order by lp;
