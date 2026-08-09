begin;

-- Osobne typy są konieczne, ponieważ ogólny „kurs” i „samokształcenie” nie
-- pozwalają rozpoznać form objętych limitami z załącznika do Dz.U. 2022 poz. 464.
with activity_type_seed(code, name_pl, sort_order) as (
  values
    ('internal_training', 'Szkolenie wewnętrzne', 46),
    ('journal_subscription', 'Prenumerata czasopisma', 76),
    ('scientific_society_membership', 'Towarzystwo/Kolegium', 77),
    ('medical_education_platform', 'Platforma edukacyjna', 78)
)
update public.activity_types target
set name_pl = seed.name_pl,
    sort_order = seed.sort_order,
    is_active = true
from activity_type_seed seed
where target.code = seed.code;

insert into public.activity_types (code, name_pl, sort_order, is_active)
select seed.code, seed.name_pl, seed.sort_order, true
from (
  values
    ('internal_training', 'Szkolenie wewnętrzne', 46),
    ('journal_subscription', 'Prenumerata czasopisma', 76),
    ('scientific_society_membership', 'Towarzystwo/Kolegium', 77),
    ('medical_education_platform', 'Platforma edukacyjna', 78)
) as seed(code, name_pl, sort_order)
where not exists (
  select 1 from public.activity_types target where target.code = seed.code
);

-- Zachowanie istniejących wpisów: wcześniejszy adapter zapisywał te cztery
-- formy pod typami ogólnymi, ale pozostawiał ich nazwę w kolumnie title.
update public.educational_activities activity
set activity_type_id = activity_type.id
from public.activity_types activity_type
where activity_type.code = case activity.title
  when 'Szkolenie wewnętrzne' then 'internal_training'
  when 'Prenumerata czasopisma' then 'journal_subscription'
  when 'Towarzystwo/Kolegium' then 'scientific_society_membership'
  when 'Platforma edukacyjna' then 'medical_education_platform'
  else null
end
and activity.title in (
  'Szkolenie wewnętrzne',
  'Prenumerata czasopisma',
  'Towarzystwo/Kolegium',
  'Platforma edukacyjna'
);

-- Zweryfikowane maksima dla lekarza i lekarza dentysty. Nie zmieniamy
-- calculation_scope na „full”: aplikacja automatyzuje tu wyłącznie jawne
-- limity maksymalne, a nie cały sposób kwalifikacji każdej formy.
insert into public.cpd_rule_requirements (
  rule_set_id,
  activity_type_id,
  requirement_kind,
  scope,
  points,
  note_pl,
  sort_order
)
select
  rule_set.id,
  activity_type.id,
  'maximum',
  limits.scope,
  limits.points,
  limits.note_pl,
  limits.sort_order
from public.cpd_rule_sets rule_set
join public.professions profession
  on profession.id = rule_set.profession_id
join (
  values
    (
      'internal_training',
      'item',
      6::numeric,
      '1 pkt za godzinę szkolenia merytorycznego, nie więcej niż 6 pkt za jedno szkolenie.',
      10
    ),
    (
      'journal_subscription',
      'period',
      10::numeric,
      '5 pkt za tytuł, nie więcej niż 10 pkt w okresie rozliczeniowym.',
      20
    ),
    (
      'scientific_society_membership',
      'period',
      20::numeric,
      '5 pkt za członkostwo w jednym kolegium lub towarzystwie, nie więcej niż 20 pkt w okresie rozliczeniowym.',
      30
    ),
    (
      'medical_education_platform',
      'period',
      10::numeric,
      '5 pkt za aktywne konto na platformie wskazanej przez NRL, nie więcej niż 10 pkt w okresie rozliczeniowym.',
      40
    )
) as limits(code, scope, points, note_pl, sort_order)
  on true
join public.activity_types activity_type
  on activity_type.code = limits.code
where profession.code in ('doctor', 'dentist')
  and rule_set.version = '2022.1'
  and rule_set.status = 'verified'
on conflict (rule_set_id, activity_type_id, requirement_kind, scope)
do update set
  points = excluded.points,
  note_pl = excluded.note_pl,
  sort_order = excluded.sort_order;

update public.cpd_rule_sets rule_set
set last_verified_on = date '2026-08-09'
from public.professions profession
where profession.id = rule_set.profession_id
  and profession.code in ('doctor', 'dentist')
  and rule_set.version = '2022.1'
  and rule_set.status = 'verified';

update public.cpd_rule_sources source
set verified_on = date '2026-08-09'
from public.cpd_rule_sets rule_set
join public.professions profession on profession.id = rule_set.profession_id
where source.rule_set_id = rule_set.id
  and profession.code in ('doctor', 'dentist')
  and rule_set.version = '2022.1'
  and source.is_primary;

do $$
declare
  requirement_count integer;
begin
  select count(*)
  into requirement_count
  from public.cpd_rule_requirements requirement
  join public.cpd_rule_sets rule_set on rule_set.id = requirement.rule_set_id
  join public.professions profession on profession.id = rule_set.profession_id
  join public.activity_types activity_type on activity_type.id = requirement.activity_type_id
  where profession.code in ('doctor', 'dentist')
    and rule_set.version = '2022.1'
    and requirement.requirement_kind = 'maximum'
    and activity_type.code in (
      'internal_training',
      'journal_subscription',
      'scientific_society_membership',
      'medical_education_platform'
    );

  if requirement_count <> 8 then
    raise exception
      'CRPE v6.23: oczekiwano 8 limitów lekarz/dentysta, znaleziono %',
      requirement_count;
  end if;
end
$$;

commit;

select
  profession.code as profession,
  activity_type.code as activity_type,
  requirement.scope,
  requirement.points,
  case
    when requirement.points > 0 then 'OK'
    else 'BŁĄD'
  end as test_result
from public.cpd_rule_requirements requirement
join public.cpd_rule_sets rule_set on rule_set.id = requirement.rule_set_id
join public.professions profession on profession.id = rule_set.profession_id
join public.activity_types activity_type on activity_type.id = requirement.activity_type_id
where profession.code in ('doctor', 'dentist')
  and rule_set.version = '2022.1'
  and requirement.requirement_kind = 'maximum'
order by profession.code, requirement.sort_order;
