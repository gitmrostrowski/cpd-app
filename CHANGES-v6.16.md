# CRPE v6.16 — godziny i prowadzący szkoleń

## Zakres

- opcjonalna godzina rozpoczęcia i zakończenia szkolenia;
- strefa czasowa z domyślną wartością `Europe/Warsaw`;
- lista maksymalnie 20 prowadzących;
- nowe pola w formularzu zgłoszenia i panelu administratora;
- godziny w bloku daty na karcie katalogu;
- pierwszy prowadzący oraz liczba pozostałych w metadanych karty;
- pełna lista prowadzących i godziny na stronie szkolenia;
- `startDate`, `endDate` z przesunięciem strefy oraz `instructor` w JSON-LD;
- lepszy komunikat przy braku opisu i prowadzących;
- walidacja kolejności dat i godzin w aplikacji oraz bazie.

## Zgodność

Dotychczasowe szkolenia pozostają bez godzin i prowadzących. Migracja uzupełnia im jedynie domyślną strefę czasową. Nowe pola są opcjonalne, dlatego nie trzeba ręcznie poprawiać istniejących rekordów.

## Wdrożenie

W tej wersji kolejność ma znaczenie: najpierw wykonaj migrację SQL, a dopiero potem wgraj kod do GitHuba/Vercel. Kod v6.16 odczytuje nowe kolumny i przed migracją publiczny katalog zwróci błąd zapytania.
