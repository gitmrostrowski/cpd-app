-- CRPE v4: jeden słownik zawodów i wersjonowane reguły CPD.
--
-- Kolejność wdrożenia:
--   1. uruchom ten plik w SQL Editor projektu Frankfurt,
--   2. sprawdź 10 wyników OK na końcu,
--   3. dopiero potem wdroż repozytorium v4.
--
-- Założenia bezpieczeństwa:
--   * migracja nie zmienia istniejących zawodów, aktywności ani punktów;
--   * istniejące cykle pozostają celami własnymi/migracyjnymi;
--   * tylko zweryfikowane zestawy reguł mogą być proponowane przez aplikację;
--   * szczegółowe limity form nie są dodawane bez zweryfikowanego mapowania;
--   * RLS pozostaje włączone.

begin;

-- ---------------------------------------------------------------------------
-- 1. Rozszerzenie istniejącego, kanonicznego słownika zawodów
-- ---------------------------------------------------------------------------

alter table public.professions
  add column if not exists slug text,
  add column if not exists name_pl_plural text,
  add column if not exists description_pl text,
  add column if not exists identifier_label text,
  add column if not exists is_other boolean not null default false;

update public.professions
set
  slug = coalesce(slug, code),
  is_other = (code = 'other_medical_profession')
where slug is null
   or is_other is distinct from (code = 'other_medical_profession');

create unique index if not exists professions_slug_key
  on public.professions (slug)
  where slug is not null;

-- Aktualizacja nazw nie zmienia identyfikatorów ani powiązań istniejących kont.
update public.professions
set
  name_pl_plural = case code
    when 'doctor' then 'Lekarze'
    when 'dentist' then 'Lekarze dentyści'
    when 'nurse' then 'Pielęgniarki i pielęgniarze'
    when 'midwife' then 'Położne'
    when 'physiotherapist' then 'Fizjoterapeuci'
    when 'paramedic' then 'Ratownicy medyczni'
    when 'pharmacist' then 'Farmaceuci'
    when 'laboratory_diagnostician' then 'Diagności laboratoryjni'
    when 'other_medical_profession' then 'Inne zawody'
    else coalesce(name_pl_plural, name_pl)
  end,
  identifier_label = case code
    when 'doctor' then 'Numer PWZ'
    when 'dentist' then 'Numer PWZ'
    else identifier_label
  end
where code in (
  'doctor',
  'dentist',
  'nurse',
  'midwife',
  'physiotherapist',
  'paramedic',
  'pharmacist',
  'laboratory_diagnostician',
  'other_medical_profession'
);

-- ---------------------------------------------------------------------------
-- 2. Wersjonowane zestawy reguł, wymagania i źródła
-- ---------------------------------------------------------------------------

create table if not exists public.cpd_rule_sets (
  id uuid primary key default gen_random_uuid(),
  profession_id uuid not null
    references public.professions(id) on delete restrict,
  version text not null,
  name_pl text not null,
  status text not null default 'draft'
    check (status in ('draft', 'verified', 'retired')),
  calculation_scope text not null default 'target_only'
    check (calculation_scope in ('target_only', 'full')),
  valid_from date,
  valid_to date,
  period_months integer
    check (period_months is null or period_months > 0),
  required_points numeric
    check (required_points is null or required_points >= 0),
  formal_confirmation_authority text,
  summary_pl text,
  disclaimer_pl text not null default
    'CRPE prowadzi ewidencję pomocniczą. Formalnego potwierdzenia dokonuje właściwy organ poza CRPE.',
  last_verified_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cpd_rule_sets_version_key unique (profession_id, version),
  constraint cpd_rule_sets_date_order
    check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint cpd_rule_sets_verified_complete
    check (
      status <> 'verified'
      or (
        valid_from is not null
        and period_months is not null
        and required_points is not null
        and last_verified_on is not null
      )
    )
);

create table if not exists public.cpd_rule_sources (
  id uuid primary key default gen_random_uuid(),
  rule_set_id uuid not null
    references public.cpd_rule_sets(id) on delete cascade,
  source_kind text not null default 'legal_act'
    check (source_kind in (
      'legal_act',
      'official_guidance',
      'professional_body',
      'other'
    )),
  title text not null,
  url text not null,
  published_on date,
  verified_on date not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint cpd_rule_sources_url_length
    check (char_length(url) between 8 and 2048),
  constraint cpd_rule_sources_unique unique (rule_set_id, url)
);

create table if not exists public.cpd_rule_requirements (
  id uuid primary key default gen_random_uuid(),
  rule_set_id uuid not null
    references public.cpd_rule_sets(id) on delete cascade,
  activity_type_id uuid
    references public.activity_types(id) on delete restrict,
  requirement_kind text not null
    check (requirement_kind in ('minimum', 'maximum', 'fixed')),
  scope text not null
    check (scope in ('period', 'year', 'item')),
  points numeric not null check (points >= 0),
  note_pl text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint cpd_rule_requirements_unique
    unique (rule_set_id, activity_type_id, requirement_kind, scope)
);

create index if not exists cpd_rule_sets_profession_status_idx
  on public.cpd_rule_sets (profession_id, status, valid_from desc);

create index if not exists cpd_rule_sources_rule_set_idx
  on public.cpd_rule_sources (rule_set_id, is_primary desc);

create index if not exists cpd_rule_requirements_rule_set_idx
  on public.cpd_rule_requirements (rule_set_id, sort_order);

-- Użyj wspólnego triggera updated_at, jeśli istnieje w schemacie Frankfurt.
do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null
     and not exists (
       select 1
       from pg_trigger
       where tgname = 'cpd_rule_sets_set_updated_at'
         and not tgisinternal
     )
  then
    execute '
      create trigger cpd_rule_sets_set_updated_at
      before update on public.cpd_rule_sets
      for each row execute function public.set_updated_at()
    ';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. Przypięcie wersji reguły do cyklu bez zmiany istniejących cykli
-- ---------------------------------------------------------------------------

alter table public.cpd_cycles
  add column if not exists rule_set_id uuid
    references public.cpd_rule_sets(id) on delete set null,
  add column if not exists target_mode text not null default 'custom',
  add column if not exists formal_status text not null default 'not_confirmed',
  add column if not exists formal_confirmed_at date,
  add column if not exists formal_confirmation_note text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cpd_cycles_target_mode_check'
      and conrelid = 'public.cpd_cycles'::regclass
  ) then
    alter table public.cpd_cycles
      add constraint cpd_cycles_target_mode_check
      check (target_mode in ('custom', 'rule_set'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cpd_cycles_formal_status_check'
      and conrelid = 'public.cpd_cycles'::regclass
  ) then
    alter table public.cpd_cycles
      add constraint cpd_cycles_formal_status_check
      check (formal_status in ('not_confirmed', 'confirmed_externally'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cpd_cycles_rule_set_mode_check'
      and conrelid = 'public.cpd_cycles'::regclass
  ) then
    alter table public.cpd_cycles
      add constraint cpd_cycles_rule_set_mode_check
      check (
        (target_mode = 'custom')
        or (target_mode = 'rule_set' and rule_set_id is not null)
      );
  end if;
end
$$;

create index if not exists cpd_cycles_rule_set_idx
  on public.cpd_cycles (rule_set_id)
  where rule_set_id is not null;

-- Wszystkie rekordy sprzed v4 pozostają świadomie celami własnymi.
-- Nie nadpisujemy ich okresu ani liczby punktów.
update public.cpd_cycles
set target_mode = 'custom',
    rule_set_id = null
where rule_set_id is null
  and target_mode is distinct from 'custom';

-- ---------------------------------------------------------------------------
-- 4. RLS i granty katalogowe
-- ---------------------------------------------------------------------------

alter table public.cpd_rule_sets enable row level security;
alter table public.cpd_rule_sources enable row level security;
alter table public.cpd_rule_requirements enable row level security;

grant select on table
  public.professions,
  public.cpd_rule_sets,
  public.cpd_rule_sources,
  public.cpd_rule_requirements
to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'cpd_rule_sets'
      and policyname = 'cpd_rule_sets_select_authenticated'
  ) then
    create policy cpd_rule_sets_select_authenticated
      on public.cpd_rule_sets
      for select
      to authenticated
      using (status in ('draft', 'verified', 'retired'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'cpd_rule_sources'
      and policyname = 'cpd_rule_sources_select_authenticated'
  ) then
    create policy cpd_rule_sources_select_authenticated
      on public.cpd_rule_sources
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.cpd_rule_sets rs
          where rs.id = cpd_rule_sources.rule_set_id
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'cpd_rule_requirements'
      and policyname = 'cpd_rule_requirements_select_authenticated'
  ) then
    create policy cpd_rule_requirements_select_authenticated
      on public.cpd_rule_requirements
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.cpd_rule_sets rs
          where rs.id = cpd_rule_requirements.rule_set_id
        )
      );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 5. Dane startowe: jedna zweryfikowana reguła, pozostałe jako robocze
-- ---------------------------------------------------------------------------

insert into public.cpd_rule_sets (
  profession_id,
  version,
  name_pl,
  status,
  calculation_scope,
  valid_from,
  period_months,
  required_points,
  formal_confirmation_authority,
  summary_pl,
  disclaimer_pl,
  last_verified_on
)
select
  p.id,
  '2022.1',
  case
    when p.code = 'doctor'
      then 'Doskonalenie zawodowe lekarza — reguła podstawowa'
    else 'Doskonalenie zawodowe lekarza dentysty — reguła podstawowa'
  end,
  'verified',
  'target_only',
  date '2022-03-01',
  48,
  200,
  'Właściwa okręgowa rada lekarska',
  'Ogólna reguła to 200 punktów w okresie 48 miesięcy. CRPE nie automatyzuje jeszcze wyjątków, w tym obniżenia celu dla okresu objętego stanem zagrożenia epidemicznego lub stanem epidemii, ani szczegółowej kwalifikacji każdej formy aktywności.',
  'Wynik CRPE jest ewidencją pomocniczą. Przed zastosowaniem celu należy sprawdzić wyjątki z rozporządzenia. Zaliczenie poszczególnych form i formalne potwierdzenie obowiązku pozostaje po stronie właściwej okręgowej rady lekarskiej.',
  date '2026-07-29'
from public.professions p
where p.code in ('doctor', 'dentist')
on conflict (profession_id, version) do update
set
  name_pl = excluded.name_pl,
  status = excluded.status,
  calculation_scope = excluded.calculation_scope,
  valid_from = excluded.valid_from,
  valid_to = null,
  period_months = excluded.period_months,
  required_points = excluded.required_points,
  formal_confirmation_authority = excluded.formal_confirmation_authority,
  summary_pl = excluded.summary_pl,
  disclaimer_pl = excluded.disclaimer_pl,
  last_verified_on = excluded.last_verified_on;

insert into public.cpd_rule_sources (
  rule_set_id,
  source_kind,
  title,
  url,
  published_on,
  verified_on,
  is_primary
)
select
  rs.id,
  'legal_act',
  'Rozporządzenie Ministra Zdrowia z dnia 21 lutego 2022 r. w sprawie sposobu dopełnienia obowiązku doskonalenia zawodowego lekarzy i lekarzy dentystów (Dz.U. 2022 poz. 464)',
  'https://eli.gov.pl/eli/DU/2022/464/ogl',
  date '2022-02-25',
  date '2026-07-29',
  true
from public.cpd_rule_sets rs
join public.professions p on p.id = rs.profession_id
where p.code in ('doctor', 'dentist')
  and rs.version = '2022.1'
on conflict (rule_set_id, url) do update
set
  title = excluded.title,
  source_kind = excluded.source_kind,
  published_on = excluded.published_on,
  verified_on = excluded.verified_on,
  is_primary = excluded.is_primary;

-- Pozostałe zawody dostają jawny rekord roboczy bez fikcyjnego celu.
-- Status draft powoduje, że aplikacja nie użyje go do automatycznej oceny.
insert into public.cpd_rule_sets (
  profession_id,
  version,
  name_pl,
  status,
  calculation_scope,
  summary_pl,
  disclaimer_pl
)
select
  p.id,
  'draft-1',
  p.name_pl || ' — reguły do weryfikacji',
  'draft',
  'target_only',
  'Reguły dla tego zawodu nie zostały jeszcze zweryfikowane i nie są automatycznie stosowane.',
  'Użytkownik może prowadzić ewidencję i ustawić własny cel. CRPE nie przedstawia go jako wymogu ustawowego.'
from public.professions p
where p.code not in ('doctor', 'dentist')
on conflict (profession_id, version) do update
set
  name_pl = excluded.name_pl,
  status = 'draft',
  calculation_scope = excluded.calculation_scope,
  valid_from = null,
  valid_to = null,
  period_months = null,
  required_points = null,
  summary_pl = excluded.summary_pl,
  disclaimer_pl = excluded.disclaimer_pl,
  last_verified_on = null;

-- ---------------------------------------------------------------------------
-- 6. Kontrola: przerwij transakcję, jeśli fundament jest niespójny
-- ---------------------------------------------------------------------------

do $$
declare
  verified_doctor_rules integer;
  source_count integer;
begin
  select count(*)
  into verified_doctor_rules
  from public.cpd_rule_sets rs
  join public.professions p on p.id = rs.profession_id
  where p.code in ('doctor', 'dentist')
    and rs.version = '2022.1'
    and rs.status = 'verified'
    and rs.period_months = 48
    and rs.required_points = 200;

  if verified_doctor_rules <> 2 then
    raise exception
      'CRPE v4: oczekiwano 2 zweryfikowanych reguł lekarz/lekarz dentysta, znaleziono %',
      verified_doctor_rules;
  end if;

  select count(*)
  into source_count
  from public.cpd_rule_sources s
  join public.cpd_rule_sets rs on rs.id = s.rule_set_id
  join public.professions p on p.id = rs.profession_id
  where p.code in ('doctor', 'dentist')
    and rs.version = '2022.1'
    and s.is_primary;

  if source_count <> 2 then
    raise exception
      'CRPE v4: brak kompletu źródeł podstawowych; oczekiwano 2, znaleziono %',
      source_count;
  end if;
end
$$;

commit;

-- ---------------------------------------------------------------------------
-- 7. Raport kontrolny — wszystkie wiersze powinny mieć wynik OK
-- ---------------------------------------------------------------------------

with tests(test_order, test_name, passed) as (
  values
    (
      1,
      'Słownik zawodów istnieje i ma aktywne rekordy',
      (select count(*) >= 8 from public.professions where is_active)
    ),
    (
      2,
      'Tabela cpd_rule_sets istnieje',
      to_regclass('public.cpd_rule_sets') is not null
    ),
    (
      3,
      'Tabela cpd_rule_sources istnieje',
      to_regclass('public.cpd_rule_sources') is not null
    ),
    (
      4,
      'Tabela cpd_rule_requirements istnieje',
      to_regclass('public.cpd_rule_requirements') is not null
    ),
    (
      5,
      'Lekarz i lekarz dentysta: 200 pkt / 48 miesięcy',
      (
        select count(*) = 2
        from public.cpd_rule_sets rs
        join public.professions p on p.id = rs.profession_id
        where p.code in ('doctor', 'dentist')
          and rs.status = 'verified'
          and rs.version = '2022.1'
          and rs.period_months = 48
          and rs.required_points = 200
      )
    ),
    (
      6,
      'Każda zweryfikowana reguła ma źródło podstawowe',
      not exists (
        select 1
        from public.cpd_rule_sets rs
        where rs.status = 'verified'
          and not exists (
            select 1
            from public.cpd_rule_sources s
            where s.rule_set_id = rs.id
              and s.is_primary
          )
      )
    ),
    (
      7,
      'Reguły robocze nie mają fikcyjnych celów',
      not exists (
        select 1
        from public.cpd_rule_sets
        where status = 'draft'
          and (required_points is not null or period_months is not null)
      )
    ),
    (
      8,
      'RLS jest włączone dla trzech tabel reguł',
      (
        select count(*) = 3
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname in (
            'cpd_rule_sets',
            'cpd_rule_sources',
            'cpd_rule_requirements'
          )
          and c.relrowsecurity
      )
    ),
    (
      9,
      'Zalogowany użytkownik ma SELECT do katalogu i reguł',
      has_table_privilege('authenticated', 'public.professions', 'SELECT')
      and has_table_privilege('authenticated', 'public.cpd_rule_sets', 'SELECT')
      and has_table_privilege('authenticated', 'public.cpd_rule_sources', 'SELECT')
      and has_table_privilege('authenticated', 'public.cpd_rule_requirements', 'SELECT')
    ),
    (
      10,
      'Istniejące cykle nie zostały automatycznie przypięte do reguł',
      not exists (
        select 1
        from public.cpd_cycles
        where target_mode = 'rule_set'
          and rule_set_id is null
      )
    )
)
select
  test_order,
  test_name,
  case when passed then 'OK' else 'BŁĄD' end as result
from tests
order by test_order;
