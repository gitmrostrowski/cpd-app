# CRPE v6.27.5 — instrukcja wdrożenia

## Zalecany branch

`feature/layout-color-system-v6.27.5`

## Zalecany commit

`CRPE v6.27.5 - wspolny layout 1200 i semantyczne kolory`

## Wdrożenie

1. Zacznij od aktualnego i czystego `main`.
2. Utwórz nowy branch z `main`.
3. Skopiuj zawartość paczki v6.27.5 do katalogu repo (zastąp pliki, nie twórz zagnieżdżonego `cpd-app/cpd-app`).
4. W GitHub Desktop sprawdź listę zmian przed commitem.
5. Commit i `Push origin`.
6. Poczekaj na Vercel Preview.
7. Na Preview sprawdź stronę główną, `/panel-cpd`, `/baza-szkolen` oraz przykładową stronę szczegółu szkolenia.
8. Szczególnie porównaj lewą i prawą krawędź zawartości z Headerem/Footerem — wszystkie widoki mają 1200 px.
9. Sprawdź CTA: wszystkie akcje brandowe powinny mieć ten sam niebieski `#1D4ED8`; success/warning/danger mają być używane wyłącznie jako status danych.
10. Dopiero po poprawnym Preview utwórz PR do `main`.

## Kontrole

Po instalacji zależności można uruchomić:

```bash
npm run check:v6.27.5
npm run lint
npm run build
```

Dodatkowo brief wymaga, aby oba polecenia zwróciły zero wyników:

```bash
grep -rn "bg-blue-\|text-blue-\|border-blue-\|ring-blue-\|bg-amber-\|text-amber-\|border-amber-\|ring-amber-\|bg-emerald-\|text-emerald-\|border-emerald-\|bg-red-\|text-red-\|border-red-\|indigo-" app/panel-cpd/ app/baza-szkolen/

grep -rn "max-w-\[1180px\]\|max-w-\[1220px\]\|max-w-\[1280px\]" app/ components/
```

W przygotowanej paczce oba zwracają zero wyników.

## Migracje / konfiguracja

- SQL: **NIE**
- Supabase: **bez zmian**
- importer NIL: **bez zmian**
- GitHub Actions NIL: **bez zmian**
- Secrets / Variables: **bez zmian**
- Vercel: **bez nowych zmiennych**
