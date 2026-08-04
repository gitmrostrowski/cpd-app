-- CRPE v6.1 / opcjonalne logo organizatora przy szkoleniu
-- Uruchom po migracji 20260804_crpe_v6_public_training_directory.sql.

begin;

alter table public.trainings
  add column if not exists organizer_logo_path text;

do $constraint$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.trainings'::regclass
      and conname = 'trainings_organizer_logo_path_format'
  ) then
    alter table public.trainings
      add constraint trainings_organizer_logo_path_format
      check (
        organizer_logo_path is null
        or organizer_logo_path ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
      );
  end if;
end
$constraint$;

comment on column public.trainings.organizer_logo_path is
  'Wewnętrzna ścieżka WebP w bucketcie training-organizer-logos; nie jest udostępniana anonimowo.';

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'training-organizer-logos',
  'training-organizer-logos',
  true,
  2097152,
  array['image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Nie tworzymy polityk INSERT/UPDATE/DELETE dla anon ani authenticated.
-- Przeglądarka wysyła plik do uwierzytelnionego endpointu CRPE, a zapis do
-- Storage wykonuje wyłącznie serwer przy użyciu SUPABASE_SERVICE_ROLE_KEY.

commit;

-- Kontrola po wykonaniu migracji. Każdy wiersz powinien mieć wynik OK.
with tests as (
  select
    1 as lp,
    'Istnieje wewnętrzna ścieżka logo'::text as test,
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'trainings'
        and column_name = 'organizer_logo_path'
    ) as ok
  union all
  select
    2,
    'Anon nie może odczytać wewnętrznej ścieżki logo',
    not has_column_privilege(
      'anon',
      'public.trainings',
      'organizer_logo_path',
      'select'
    )
  union all
  select
    3,
    'Bucket jest publiczny tylko dla odczytu plików',
    exists (
      select 1
      from storage.buckets
      where id = 'training-organizer-logos'
        and public = true
        and file_size_limit = 2097152
        and allowed_mime_types = array['image/webp']::text[]
    )
  union all
  select
    4,
    'Brak polityki bezpośredniego zapisu do bucketu',
    not exists (
      select 1
      from pg_policies
      where schemaname = 'storage'
        and tablename = 'objects'
        and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
        and (
          coalesce(qual, '') ilike '%training-organizer-logos%'
          or coalesce(with_check, '') ilike '%training-organizer-logos%'
        )
        and (
          'anon' = any(roles)
          or 'authenticated' = any(roles)
          or 'public' = any(roles)
        )
    )
  union all
  select
    5,
    'Anon nadal może odczytać publiczny URL logo',
    has_column_privilege(
      'anon',
      'public.trainings',
      'organizer_logo_url',
      'select'
    )
)
select
  lp,
  test,
  case when ok then 'OK' else 'BŁĄD' end as wynik
from tests
order by lp;
