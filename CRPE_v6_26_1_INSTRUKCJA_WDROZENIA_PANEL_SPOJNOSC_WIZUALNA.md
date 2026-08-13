# CRPE v6.26.1 — instrukcja wdrożenia Panelu CPD

Data: 2026-08-13

## Co zawiera ta paczka

To jest **pełne repozytorium** zbudowane na finalnej v6.26 i rozszerzone o v6.26.1.
Nie należy nakładać go na starszą przypadkową paczkę ani odtwarzać zmian ręcznie.

v6.26.1 obejmuje:
- nową hierarchię Panelu CPD ze statusem na pierwszym miejscu;
- ustawienia okresu schowane pod `Zmień ustawienia`;
- mocniejsze hero statusu i grubszy pasek postępu;
- semantyczne kolory statusów;
- aktywności z blokiem daty/roku, dużą liczbą punktów i mocniejszym CTA;
- dwukolumnowy układ z sidebarem `Oś aktywności` + `Najbliższe terminy`;
- segmentowaną prezentację pojemności limitów;
- uproszczenie wersalików;
- nowy przełącznik jednej/wielu placówek z wyszukiwaniem i toastem.

Wszystkie zmiany v6.26 dotyczące admina szkoleń, importera NIL i bezpieczeństwa zmian operacyjnych pozostają w repo.

## Czy potrzebny jest SQL?

### Sama różnica v6.26 → v6.26.1

**NIE.** v6.26.1 nie zawiera nowej migracji bazy.

### Wdrożenie tej pełnej paczki bezpośrednio z obecnej produkcji v6.25.4

**TAK — nadal potrzebny jest SQL z v6.26, przed frontendem:**

`supabase/migrations/20260813_crpe_v6_26_operational_import_fields.sql`

Powód: pełna paczka zawiera także frontend v6.26 korzystający z bezpiecznego RPC dla zmian operacyjnych importu NIL.

Jeżeli v6.26 oraz jej migracja zostały już wcześniej wdrożone i potwierdzone, nie uruchamiaj migracji ponownie tylko z powodu v6.26.1 — najpierw potwierdź stan środowiska.

## Czy potrzebne są nowe sekrety lub ustawienia?

**NIE.**

Nie zmieniaj:
- `.env` / zmiennych Vercel;
- kluczy Supabase;
- SMTP / Brevo;
- GitHub Secrets;
- harmonogramu ani workflow importera NIL.

Nie uruchamiaj ręcznie importera NIL w ramach tego wdrożenia.

## Zalecane nazwy

Branch:

`feature/panel-spojnosc-wizualna-v6.26.1`

Commit:

`CRPE v6.26.1 - spojnosc wizualna Panelu CPD`

Pull Request:

`CRPE v6.26.1 – spójność wizualna Panelu CPD`

## Bezpieczna kolejność od produkcji v6.25.4

1. W **GitHub Desktop** przełącz repozytorium `cpd-app` na `main`.
2. Kliknij **Fetch origin**; jeżeli pojawi się **Pull origin**, wykonaj go.
3. Upewnij się, że GitHub Desktop nie pokazuje lokalnych niezatwierdzonych zmian.
4. Utwórz branch `feature/panel-spojnosc-wizualna-v6.26.1`.
5. Skopiuj **zawartość** tej paczki do katalogu repozytorium — nie kopiuj całego folderu paczki jako podfolderu.
6. Na tym etapie nie rób merge i nie publikuj nic na `main`.
7. Ponieważ produkcja była ostatnio potwierdzona na v6.25.4, przed wdrożeniem frontendu wykonaj migrację v6.26 w **Supabase Frankfurt / SQL Editor**:
   `supabase/migrations/20260813_crpe_v6_26_operational_import_fields.sql`.
8. Sprawdź wynik kontroli migracji zgodnie z instrukcją v6.26 znajdującą się w repo.
9. W GitHub Desktop wykonaj commit `CRPE v6.26.1 - spojnosc wizualna Panelu CPD`.
10. Kliknij **Publish branch**.
11. Poczekaj na **Vercel Preview / Ready**.
12. Wykonaj ręczne testy poniżej.
13. Utwórz Pull Request do `main`.
14. Scal dopiero po przejściu kontroli i po świadomej akceptacji.
15. Po merge potwierdź nowy **Production / Ready** i sprawdź `https://www.crpe.pl`.

## Automatyczne kontrole

Po zainstalowaniu zależności w prawidłowym środowisku uruchom w katalogu repo:

```bash
npm ci
npm run check:v6.26.1
npm run check:v6.26
npm run check:v6.25.4
npm run check:v6.25.3
npm run check:v6.25.2
npx tsc --noEmit
npm run lint
npm audit
npm run build
```

Importer NIL — ponieważ pełna paczka zawiera zmiany v6.26 — powinien także przejść swoje testy:

```bash
cd integrations/training-importer
npm ci
npm test
npm run typecheck
```

## Ręczna checklista Vercel Preview

### Panel CPD — kolejność

- po wejściu do `/panel-cpd` pierwszą główną sekcją jest `Status i kroki`, a nie formularz ustawień;
- nawigacja sekcji pokazuje `Status i kroki`, `Limity`, `Aktywności`, `Najbliższe terminy`;
- `Zmień ustawienia` otwiera formularz i przewija do niego;
- zapis ustawień nadal działa jak wcześniej.

### Status

- duża liczba zdobytych punktów jest główną kotwicą wizualną;
- pasek postępu jest grubszy i pokazuje niebieskie zdobyte punkty, bursztynową kreskowaną lukę oraz marker `dziś`;
- kafle `Zebrane / Luka do tempa / Pozostaje` mają odpowiednio niebieski / bursztynowy / szary pasek po lewej;
- stan po terminie jest czerwony/różany, a kompletność zielona.

### Aktywności i sidebar

- na desktopie lista aktywności jest w lewej kolumnie, a `Oś aktywności` i `Najbliższe terminy` w prawej;
- wiersze aktywności mają stały blok daty/roku po lewej;
- punkty są duże i niebieskie;
- wpis wymagający działania ma wypełniony CTA;
- na telefonie układ wraca do jednej kolumny i nic nie wychodzi poza ekran.

### Limity

- lista kategorii pokazuje segmentowane paski pojemności;
- aktywna kategoria ma niebieskie zaznaczenie;
- `Możesz jeszcze … pkt` jest najmocniejszą liczbą karty;
- logika `wykorzystano / maksimum` pozostaje taka sama jak w v6.25.4/v6.26.

### Placówki

Przetestuj co najmniej konto z jedną placówką i — jeśli masz — konto z wieloma:

- 1 placówka: pigułka pokazuje `Placówka`, bez chevronu i bez uciętej nazwy;
- wiele: pigułka pokazuje `Placówka · N` oraz aktywną nazwę / `Wybierz kontekst`;
- menu pokazuje pełną nazwę i role;
- wyszukiwarka pojawia się dopiero przy więcej niż 6 placówkach;
- zmiana placówki prowadzi do właściwego kontekstu i wyświetla toast;
- `Wróć do widoku osobistego`, `Pokaż wszystkie placówki` i `Zarządzaj placówkami` prowadzą we właściwe miejsca.

### Regresje v6.26

Ponieważ v6.26 nie jest jeszcze potwierdzona na produkcji, powtórz również checklistę admina/importu z:

`CRPE_v6_26_INSTRUKCJA_WDROZENIA.md`

Szczególnie sprawdź, że czysto operacyjna zmiana zapisów nie cofa zaakceptowanego szkolenia do moderacji.

## Ważne

Ta paczka nie została automatycznie wdrożona, nie wykonała SQL-a i nie zmieniła `main`.
Przed każdym krokiem wdrożeniowym potwierdź aktualny stan repozytorium i Supabase.
