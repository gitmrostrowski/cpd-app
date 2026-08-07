# CRPE v6.3 — wiarygodne zawody i punkty edukacyjne

## Zgodność z bazą Frankfurt (v5.2)

- migracja wykrywa i zastępuje konfliktujący trigger
  `trainings_enforce_classification_v5_2`;
- starsze tabele oraz zapisane w nich relacje nie są usuwane;
- istniejące powiązania są kopiowane do `training_profession_rules`, jeżeli
  starsze tabele zawierają standardowe kolumny relacji;
- panel administratora zapisuje relacje przed zatwierdzeniem szkolenia, dzięki
  czemu baza nie widzi niekompletnego stanu pośredniego.

## Baza danych

- dodano `trainings.audience_scope`;
- dodano metadane weryfikacji punktów;
- dodano relacyjną tabelę `training_profession_rules`;
- dodano RLS, granty oraz atomową funkcję moderacyjną;
- pozostawiono historyczne rekordy bez adresatów jako `unknown`;
- przeniesiono jedyny jawnie opisany rekord na lekarza i lekarza dentystę bez
  podnoszenia go do statusu niezależnie zweryfikowanego.

## Aplikacja

- filtr zawodu działa po stabilnych kodach z `public.professions`;
- brak adresatów nie jest już dopasowaniem do każdego zawodu;
- karta i szczegóły pokazują status wiarygodności punktów;
- nowe zgłoszenie zapisuje relacje do wybranych zawodów;
- serwer odrzuca nieistniejące lub nieaktywne kody zawodów;
- administrator uzupełnia adresatów, źródło i datę weryfikacji;
- oznaczenie punktów jako zweryfikowane bez źródła i daty jest blokowane.

## Kontrola

- `npm run check:v6.3` — 8/8 OK;
- `npx tsc --noEmit` — OK;
- wcześniejsze testy v6.2.2 i v6.2.3 — OK.

Pełny `next build` w środowisku roboczym został zatrzymany przez błąd runtime
Node `ENOENT: uv_resident_set_memory`; kompilator TypeScript nie wykazał błędów
aplikacji.
