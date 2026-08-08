-- CRPE v6.16 / godziny i prowadzący szkoleń
-- Uruchomić w Supabase SQL Editor PRZED wdrożeniem kodu v6.16.

begin;

alter table public.trainings
  add column if not exists start_time time without time zone,
  add column if not exists end_time time without time zone,
  add column if not exists time_zone text not null default 'Europe/Warsaw',
  add column if not exists speakers text[] not null default '{}'::text[];

update public.trainings
set time_zone = 'Europe/Warsaw'
where time_zone is null or btrim(time_zone) = '';

update public.trainings
set speakers = '{}'::text[]
where speakers is null;

alter table public.trainings
  alter column time_zone set default 'Europe/Warsaw',
  alter column time_zone set not null,
  alter column speakers set default '{}'::text[],
  alter column speakers set not null;

do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_time_zone_not_blank'
  ) then
    alter table public.trainings
      add constraint trainings_time_zone_not_blank
      check (char_length(btrim(time_zone)) between 1 and 100);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_speakers_limit'
  ) then
    alter table public.trainings
      add constraint trainings_speakers_limit
      check (cardinality(speakers) <= 20);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_end_time_requires_start_time'
  ) then
    alter table public.trainings
      add constraint trainings_end_time_requires_start_time
      check (end_time is null or start_time is not null);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_same_day_time_order'
  ) then
    alter table public.trainings
      add constraint trainings_same_day_time_order
      check (
        start_time is null
        or end_time is null
        or (ends_on is not null and ends_on > starts_on)
        or end_time > start_time
      );
  end if;
end
$constraints$;

grant select (start_time, end_time, time_zone, speakers)
on public.trainings to anon;

commit;

-- Kontrola po wykonaniu. Każdy wiersz powinien mieć wynik OK.
with tests as (
  select 1 as lp, 'Kolumna godziny rozpoczęcia istnieje'::text as test,
    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trainings' and column_name = 'start_time') as ok
  union all
  select 2, 'Kolumna godziny zakończenia istnieje',
    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trainings' and column_name = 'end_time')
  union all
  select 3, 'Kolumna strefy czasowej istnieje',
    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trainings' and column_name = 'time_zone')
  union all
  select 4, 'Kolumna prowadzących istnieje',
    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trainings' and column_name = 'speakers')
  union all
  select 5, 'Anon może odczytać godziny i prowadzących',
    has_column_privilege('anon', 'public.trainings', 'start_time', 'select')
    and has_column_privilege('anon', 'public.trainings', 'end_time', 'select')
    and has_column_privilege('anon', 'public.trainings', 'time_zone', 'select')
    and has_column_privilege('anon', 'public.trainings', 'speakers', 'select')
)
select lp, test, case when ok then 'OK' else 'BŁĄD' end as wynik
from tests
order by lp;
