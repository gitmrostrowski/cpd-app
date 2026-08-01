-- CRPE v5.2.1 — zgodność historycznych szkoleń po klasyfikacji v5.2
-- Migracja jest idempotentna. Nie przypisuje pustych danych do wszystkich zawodów.

begin;

-- Jedyny rozpoznany historyczny opis wielozawodowy mapujemy konserwatywnie
-- do lekarza i lekarza dentysty. Pozostałe puste opisy pozostają unknown.
insert into public.training_target_professions (training_id, profession_id)
select t.id, p.id
from public.trainings t
join public.professions p on p.code in ('doctor', 'dentist')
where t.audience_scope = 'unknown'
  and regexp_replace(
    lower(trim(coalesce(t.target_profession_text, ''))),
    '\s+',
    ' ',
    'g'
  ) = 'szkolenie dla lekarzy i lekarzy dentystów'
on conflict (training_id, profession_id) do nothing;

update public.trainings t
set audience_scope = 'selected'
where t.audience_scope = 'unknown'
  and regexp_replace(
    lower(trim(coalesce(t.target_profession_text, ''))),
    '\s+',
    ' ',
    'g'
  ) = 'szkolenie dla lekarzy i lekarzy dentystów'
  and exists (
    select 1
    from public.training_target_professions tp
    where tp.training_id = t.id
  );

commit;

-- Kontrola po migracji: wszystkie wiersze powinny zwrócić OK.
select *
from (
  select 1 as lp, 'Szkolenia nie zostały usunięte' as test,
         case when count(*) > 0 then 'OK' else 'BLAD' end as wynik,
         count(*)::text as szczegoly
  from public.trainings

  union all

  select 2, 'Puste historyczne dane nie są oznaczone jako dla wszystkich',
         case when count(*) = 0 then 'OK' else 'BLAD' end,
         count(*)::text
  from public.trainings
  where audience_scope = 'all'
    and nullif(trim(coalesce(target_profession_text, '')), '') is null

  union all

  select 3, 'Rozpoznany opis lekarz i lekarz dentysta ma dwa zawody',
         case when count(*) = 0 then 'OK' else 'BLAD' end,
         count(*)::text
  from public.trainings t
  where regexp_replace(lower(trim(coalesce(t.target_profession_text, ''))), '\s+', ' ', 'g')
        = 'szkolenie dla lekarzy i lekarzy dentystów'
    and (
      t.audience_scope <> 'selected'
      or (select count(*) from public.training_target_professions tp where tp.training_id = t.id) <> 2
    )

  union all

  select 4, 'Nowe zatwierdzenia nadal wymagają klasyfikacji',
         case when count(*) = 1 then 'OK' else 'BLAD' end,
         count(*)::text
  from pg_trigger
  where tgrelid = 'public.trainings'::regclass
    and tgname = 'trainings_enforce_classification_v5_2'
    and not tgisinternal
) checks
order by lp;
