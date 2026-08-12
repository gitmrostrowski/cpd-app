# CRPE v6.25.4 — instrukcja wdrożenia

Wersja bazuje na v6.25.3 i zmienia wyłącznie prezentację panelu CPD oraz testy
regresji. Nie zmienia bazy danych, API ani importera NIL.

## 1. Branch i commit

Najpierw sprawdź stan Pull Requesta v6.25.3.

### Wariant A — PR v6.25.3 jest nadal otwarty (zalecany dla bieżącego wdrożenia)

1. Nie scalaj wcześniejszej wersji v6.25.3 z `main`.
2. W GitHub Desktop pozostań na branchu
   `feature/panel-widoki-limity-v6.25.3` i kliknij **Fetch origin**.
3. Skopiuj zawartość katalogu `cpd-app-main` z tej paczki do lokalnego
   repozytorium, zezwalając na podmianę plików.
4. Wykonaj commit:
   `CRPE v6.25.4 - spojnosc panelu CPD`.
5. Kliknij **Push origin**. Istniejący Pull Request i Vercel Preview zaktualizują
   się automatycznie.
6. Zmień tytuł istniejącego PR-a na:
   `CRPE v6.25.4 – spójność panelu CPD`.

### Wariant B — v6.25.3 została już scalona z `main`

1. W GitHub Desktop przełącz repozytorium na `main` i kliknij **Fetch origin**
   oraz **Pull origin**.
2. Utwórz branch `feature/panel-spojnosc-v6.25.4`.
3. Skopiuj zawartość katalogu `cpd-app-main` z tej paczki do lokalnego
   repozytorium, zezwalając na podmianę plików.
4. Wykonaj commit:
   `CRPE v6.25.4 - spojnosc panelu CPD`.
5. Opublikuj branch.

W obu wariantach nie uruchamiaj SQL-a i nie zmieniaj sekretów.

## 2. Kontrola Preview

1. Poczekaj na Vercel Preview ze statusem **Ready**.
2. W `/panel-cpd` sprawdź oba widoki: **Przebieg** i **Przegląd**.
3. W widoku „Przegląd” sprawdź skalę `0 pkt — cel`, położenie etykiety „dziś”
   i trzy karty pod paskiem.
4. Sprawdź główną akcję dla stanu pilnego i zwykłego: tło ma pozostać granatowe,
   a pilność ma być widoczna na plakietce.
5. W limitach sprawdź co najmniej kategorię pustą, częściowo wykorzystaną i
   wyczerpaną. Ułamek ma oznaczać `wykorzystano / maksimum`, a opis poniżej —
   pozostałą liczbę punktów.
6. Sprawdź układ na telefonie i komputerze oraz odświeżenie strony.

## 3. Pull Request i produkcja

1. Jeżeli aktualizujesz istniejący PR v6.25.3, nie twórz drugiego PR-a. Jeżeli
   używasz nowego brancha, utwórz Pull Request z
   `feature/panel-spojnosc-v6.25.4` do `main`.
2. Tytuł PR-a: `CRPE v6.25.4 – spójność panelu CPD`.
3. Poczekaj na zielone kontrole GitHuba i Vercela.
4. Po sprawdzeniu Preview połącz PR i poczekaj na produkcyjny deployment
   oznaczony **Ready**.
5. Wykonaj krótki test obu widoków i limitów na `crpe.pl`.

## Powrót awaryjny

W razie problemu cofnij wyłącznie commit v6.25.4. Nie wykonuj zmian w Supabase
i nie uruchamiaj importera NIL z powodu tego wdrożenia.
