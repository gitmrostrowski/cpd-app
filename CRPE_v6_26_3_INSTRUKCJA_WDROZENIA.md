# CRPE v6.26.3 — instrukcja bezpiecznego wdrożenia

## Co zawiera paczka

Pełne repo v6.26.3 = v6.26.2 + hotfix testów importera NIL.

Zmiana funkcjonalna tego hotfixu dotyczy tylko testów. Kod produkcyjnego parsera NIL nie został zmieniony.

## SQL / sekrety / konfiguracja

- nowy SQL: NIE,
- zmiany Supabase: NIE,
- nowe sekrety: NIE,
- zmiana `NIL_IMPORT_ENABLED`: NIE — pozostaje `true`,
- zmiany Vercel: NIE,
- zmiany Brevo/SMTP: NIE.

Uwaga: pełne repo nadal zawiera migrację v6.26. Jeżeli nie została jeszcze wykonana na produkcyjnej bazie Frankfurt, jej stan trzeba potwierdzić osobno przed korzystaniem z funkcji administracyjnych v6.26. Hotfix v6.26.3 sam w sobie tej migracji nie wymaga.

## Rekomendowany branch

`fix/nil-tests-v6.26.3`

## Rekomendowany commit

`CRPE v6.26.3 - poprawka testów automatycznego importera NIL`

## Po wdrożeniu

1. Sprawdź Vercel Preview / Production zgodnie z normalnym procesem.
2. W GitHub → Actions otwórz `Import szkoleń — NIL`.
3. Przy następnym uruchomieniu sprawdź, że etap `npm test` przechodzi 9/9.
4. Sprawdź, że workflow przechodzi dalej do właściwego importu NIL i kończy się sukcesem.
