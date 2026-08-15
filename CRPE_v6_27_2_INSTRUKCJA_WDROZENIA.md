# CRPE v6.27.2 — instrukcja bezpiecznego wdrożenia

Baza: **v6.27.1**

Zakres: wyłącznie frontend strony głównej + testy palety i dokumentacja. Wykresy Panelu CPD z v6.27 pozostają bez zmian.

## SQL / infrastruktura

- nowy SQL: **NIE**
- Supabase / RLS / RPC: **bez zmian**
- sekrety GitHub / Vercel: **bez zmian**
- Brevo / SMTP: **bez zmian**
- importer NIL: **bez zmian**
- `.github/workflows/import-nil-trainings.yml`: przywrócony do paczki jako niezmieniony plik bazowy

## Rekomendowany branch

`feature/pigment-palette-v6.27.2`

## Rekomendowany commit

`CRPE v6.27.2 - wspólna rodzina pigmentów dla ról`

## Kolejność

1. Zacznij od aktualnego `main` zawierającego wersję, na której faktycznie pracujesz.
2. `Fetch origin` / `Pull origin` w GitHub Desktop.
3. Upewnij się, że nie ma lokalnych zmian.
4. Utwórz branch `feature/pigment-palette-v6.27.2` z właściwego `main`.
5. Skopiuj zawartość tej paczki do repozytorium.
6. Sprawdź zakres zmian przed commitem.
7. Commit i Publish branch.
8. Vercel Preview — obowiązkowo sprawdź wszystkie trzy role: Medyk / Placówka / Organizator.
9. Porównaj trzy zrzuty obok siebie: powinny zmieniać się głównie aktywny tab, ikona roli i miękka plakietka; CTA, H1, tło oraz konstrukcja strony mają pozostać stabilne.
10. Dopiero po kontroli Preview utwórz PR do `main`.

## Co sprawdzić wizualnie na Preview

- Medyk = petrol `#16656B`;
- Placówka = stalowy błękit `#23528F`;
- Organizator = granatowy grafit `#4A5170`;
- główny CTA i „w jednym miejscu.” = `#1D4ED8` we wszystkich rolach;
- hero nie zmienia hue przy przełączaniu roli;
- zielony oznacza status pozytywny, a nie rolę Medyka;
- brak fioletowego / jaskrawego cyan jako szerokiego motywu roli;
- wykresy Panelu CPD działają tak samo jak w v6.27.1.
