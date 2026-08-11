-- KROK JEDNORAZOWY PO UTWORZENIU KONTA IMPORTERA W SUPABASE AUTH.
-- Zmień wyłącznie adres w pierwszej linii bloku i uruchom cały plik.

do $register_importer$
declare
  v_email text := 'WPISZ_TUTAJ_EMAIL_IMPORTERA_NIL';
  v_user_id uuid;
begin
  if v_email = 'WPISZ_TUTAJ_EMAIL_IMPORTERA_NIL' then
    raise exception 'Najpierw wpisz adres e-mail konta importera NIL.';
  end if;

  select id
    into v_user_id
  from auth.users
  where lower(email) = lower(v_email)
  order by created_at desc
  limit 1;

  if v_user_id is null then
    raise exception 'Nie znaleziono użytkownika o adresie %.', v_email;
  end if;

  insert into public.training_importer_accounts (
    source_code,
    user_id,
    is_active
  )
  values ('nil', v_user_id, true)
  on conflict (source_code, user_id) do update
  set is_active = true;
end
$register_importer$;

select
  source_code,
  user_id,
  is_active,
  case when is_active then 'OK' else 'BŁĄD' end as wynik
from public.training_importer_accounts
where source_code = 'nil';
