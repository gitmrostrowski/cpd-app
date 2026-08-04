# CRPE v6.2.3 — kompaktowy katalog szkoleń

## Zakres wersji

Wersja v6.2.3 przebudowuje wyłącznie prezentację publicznego katalogu szkoleń.
Nie zmienia modelu danych, API ani konfiguracji Supabase i zachowuje wszystkie
poprawki z v6.2.2 dotyczące adresatów szkoleń, formularza kontaktowego i logo
organizatora.

## Najważniejsze zmiany

- kompaktowa karta desktopowa w układzie: data, treść, punkty i działania;
- wysokość daty zmniejszona do 58 px, a logo organizatora do 28 px;
- tytuł pozostaje maksymalnie dwuwierszowy i otwiera szczegóły szkolenia;
- organizator, miejsce, kategoria, cena i opcjonalna grupa odbiorców tworzą
  jeden zwarty obszar metadanych;
- widoczny jest jeden tag tematyczny oraz licznik pozostałych tagów;
- wartość 0 zł jest prezentowana jako „Bezpłatne”;
- domyślne oznaczenia „Dla wszystkich” i „Wszyscy medycy” nie zajmują miejsca
  na karcie;
- przycisk zapisów jest główną akcją, a dodanie do planu akcją pomocniczą;
- na telefonie oba działania zachowują minimalną wysokość 44 px;
- lista pokazuje początkowo 10 szkoleń i rozwija się po 10;
- panel boczny jest przyklejony podczas przewijania na desktopie.

## Wdrożenie

1. Wgraj zawartość repozytorium do GitHuba.
2. Poczekaj na status `Ready` w Vercelu.
3. Otwórz `/baza-szkolen` i sprawdź szerokości desktopową oraz mobilną.
4. Sprawdź przycisk „Pokaż kolejne”, szczegóły, zapis zewnętrzny i dodawanie
   szkolenia do planu.

Nie uruchamiaj żadnej nowej migracji Supabase dla v6.2.3.

## Kontrola techniczna

```bash
npm run check:v6.2.3
npx tsc --noEmit
npx eslint app/baza-szkolen/TrainingHubClient.tsx
```
