# CRPE v6.27.11 — NIL: opis szkolenia bez kasowania ręcznej redakcji

Baza wersji: **v6.27.10**.

## Co naprawiono

1. Importer NIL rozpoznaje zwięzły opis z oficjalnej strony szczegółowej szkolenia, jeżeli występuje sekcja `Cel szkolenia`, `Cele szkolenia`, `Opis szkolenia` albo `O szkoleniu`.
2. Ten zwięzły opis jest importowany domyślnie — nie wymaga `NIL_IMPORT_FULL_DESCRIPTIONS=true`.
3. Pełna długa treść RSS nadal pozostaje opt-in. Nie kopiujemy automatycznie całego programu, biografii prowadzących i pozostałej treści strony do pola `description`.
4. Strona szczegółowa ma pierwszeństwo przed opisem z RSS, dzięki czemu opis jest pobierany z aktualnej wersji oficjalnej strony NIL.
5. Jeżeli źródło nie dostarczy opisu (`null`), istniejący ręczny opis w CRPE nie jest już traktowany jako pole do usunięcia.
6. Migracja SQL czyści już utworzone fałszywe zmiany `description -> null`:
   - jeśli zmiana zawiera również inne pola, usuwa z kolejki tylko `description`;
   - jeśli jedynym polem było `description`, oznacza zmianę jako `superseded`.

## Przykład NIL 1806

Dla szkolenia „Diagnostyka i leczenie ran przewlekłych, w tym ran atypowych” importer pobierze tekst z sekcji **Cel szkolenia**, zamiast proponować usunięcie ręcznie istniejącego opisu.

## Czego nie zmieniono

- kolejka moderacyjna zmian istniejących szkoleń nadal działa;
- nowy opis źródłowy dla istniejącego szkolenia trafia do decyzji moderatora, jeśli różni się od obecnego;
- nie zmieniono Home, Panelu CPD, Bazy szkoleń ani Admin UI;
- nie zmieniono reguł punktów, zapisów, miejsc ani publikacji.
