-- CRPE v6 / publiczna baza szkoleń
-- Cel: bezpieczny odczyt zatwierdzonych szkoleń bez logowania oraz logo
-- organizatora moderowane przez operatora platformy.

begin;

alter table public.trainings
  add column if not exists organizer_logo_url text;

do $constraint$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_organizer_logo_url_https'
  ) then
    alter table public.trainings
      add constraint trainings_organizer_logo_url_https
      check (
        organizer_logo_url is null
        or organizer_logo_url ~* '^https://'
      );
  end if;
end
$constraint$;

grant usage on schema public to anon;

-- Rola anonimowa nie może odczytać danych zgłaszającego, śladów moderacji
-- ani legacy_data. Najpierw usuwamy ewentualny szeroki grant, a następnie
-- nadajemy SELECT wyłącznie dla kolumn używanych przez publiczny katalog.
revoke all privileges on table public.trainings from anon;

grant select (
  id,
  title,
  organizer_name,
  organizer_logo_url,
  points,
  delivery_format,
  starts_on,
  ends_on,
  category,
  target_profession_text,
  location,
  external_url,
  is_partner,
  topics,
  price_pln,
  has_recording,
  capacity,
  enrollment_status,
  approval_status,
  description,
  created_at,
  updated_at
) on public.trainings to anon;

alter table public.trainings enable row level security;

drop policy if exists trainings_public_select_approved on public.trainings;
create policy trainings_public_select_approved
on public.trainings
for select
to anon
using (approval_status = 'approved');

-- Filtr zawodów także musi działać bez sesji. Udostępniamy tylko aktywny,
-- publiczny katalog, bez możliwości zapisu.
revoke all privileges on table public.professions from anon;
grant select (
  id,
  code,
  name_pl,
  name_pl_plural,
  description_pl,
  identifier_label,
  is_other,
  sort_order,
  is_active
) on public.professions to anon;

alter table public.professions enable row level security;

drop policy if exists professions_public_select_active on public.professions;
create policy professions_public_select_active
on public.professions
for select
to anon
using (is_active = true);

commit;

-- Kontrola po wykonaniu migracji. Każdy wiersz powinien mieć wynik OK.
with tests as (
  select
    1 as lp,
    'Anon może odczytać publiczny tytuł szkolenia'::text as test,
    has_column_privilege('anon', 'public.trainings', 'title', 'select') as ok
  union all
  select
    2,
    'Anon nie może odczytać e-maila zgłaszającego',
    not has_column_privilege(
      'anon',
      'public.trainings',
      'submitted_email',
      'select'
    )
  union all
  select
    3,
    'Anon nie może dodawać szkoleń bezpośrednio do tabeli',
    not has_table_privilege('anon', 'public.trainings', 'insert')
  union all
  select
    4,
    'Istnieje polityka tylko dla zatwierdzonych szkoleń',
    exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'trainings'
        and policyname = 'trainings_public_select_approved'
        and 'anon' = any(roles)
    )
  union all
  select
    5,
    'Anon może odczytać aktywny katalog zawodów',
    has_column_privilege('anon', 'public.professions', 'name_pl', 'select')
)
select
  lp,
  test,
  case when ok then 'OK' else 'BŁĄD' end as wynik
from tests
order by lp;
