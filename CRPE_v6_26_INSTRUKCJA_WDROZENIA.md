# CRPE v6.26 — instrukcja wdrożenia

Data: 2026-08-13

## Co zawiera wersja

v6.26 obejmuje:
- większe i spójne ikony nagłówków/kafli;
- korektę kolorów w zakładce Limitów Panelu CPD;
- uproszczenie nawigacji i stałą szerokość przełącznika placówki;
- nową kolejkę zmian importu NIL w panelu administratora;
- osobne filtry daty dodania i terminu szkolenia;
- bezpieczną obsługę zmian operacyjnych `enrollment_status` i `capacity`;
- ochronę przed nadpisaniem znanego stanu zapisów wartością `null`;
- zachowanie nierozstrzygniętych pól po częściowym zastosowaniu zmiany.

## Czy potrzebny jest SQL?

**TAK.**

Przed wdrożeniem frontendu trzeba wykonać:

`supabase/migrations/20260813_crpe_v6_26_operational_import_fields.sql`

w aktywnym projekcie Supabase **Frankfurt / UE**.

Migracja używa `create or replace` i nie wymaga ręcznego usuwania istniejących
funkcji. Po wykonaniu końcowa kontrola SQL powinna zwrócić **7 wierszy `OK`**.

## Czy potrzebne są sekrety lub zmiany konfiguracji?

**NIE.**

Nie zmieniamy:
- kluczy Supabase;
- zmiennych środowiskowych Vercel;
- SMTP / Brevo;
- GitHub Secrets;
- workflow ani harmonogramu importera NIL.

Nie uruchamiaj ręcznie importera NIL tylko dlatego, że wdrażasz v6.26.

## Bezpieczna kolejność

1. Na GitHub Desktop przełącz repozytorium `cpd-app` na `main`.
2. Kliknij `Fetch origin`, a jeśli pojawi się `Pull origin` — wykonaj pull.
3. Upewnij się, że nie ma lokalnych niezatwierdzonych zmian.
4. Utwórz branch:

   `feature/admin-import-review-v6.26`

5. Skopiuj **zawartość** tej paczki do katalogu repozytorium.
6. Jeszcze nie publikuj zmian.
7. W Supabase Frankfurt otwórz `SQL Editor`.
8. Wykonaj migrację:

   `supabase/migrations/20260813_crpe_v6_26_operational_import_fields.sql`

9. Potwierdź, że końcowe zapytanie pokazuje 7 razy `OK`.
10. Dopiero wtedy wróć do GitHub Desktop i wykonaj commit:

    `CRPE v6.26 - przegląd importu, limity i nawigacja`

11. Opublikuj branch.
12. Poczekaj na Vercel Preview.
13. Przetestuj Preview według checklisty poniżej.
14. Utwórz Pull Request do `main`.
15. Scal dopiero po pozytywnych kontrolach i ręcznej akceptacji.
16. Po merge potwierdź `Production / Ready` i sprawdź `https://www.crpe.pl`.

## Dlaczego SQL ma być pierwszy

Frontend używa nowego RPC:

`review_training_operational_import_change(uuid)`

dla przycisku `Przyjmij zapisy`.

To celowe zabezpieczenie: jeśli frontend zostałby omyłkowo wdrożony przed
migracją, RPC nie będzie istniał i kliknięcie zakończy się błędem **bez zmiany
statusu szkolenia**. Nadal wdrażamy jednak SQL jako pierwszy.

## Testy przed Pull Requestem

W głównym katalogu repozytorium:

```bash
npm run check:v6.26
npm run check:v6.25.4
npm run check:v6.25.3
npm run check:v6.25.2
npx tsc --noEmit
npm run lint
npm audit
```

W katalogu importera:

```bash
cd integrations/training-importer
npm ci
npm test
npm run typecheck
```

## Ręczna checklista Preview

### Panel CPD

- zakładka `Limity`:
  - aktywna kategoria ma niebieskie zaznaczenie i obrys;
  - pasek wykorzystania ma kolor zielony, bursztynowy przy ostrzeżeniu i szary
    po wyczerpaniu;
  - główny pasek okresu w `Status i kroki` pozostaje niebieski;
- ikony w nagłówkach są większe, ale nie wychodzą poza kafle.

### Nawigacja

- desktop:
  - nie ma osobnej pozycji `Moje CRPE` obok `Panel CPD`;
  - przełącznik placówki ma stałą szerokość i długa nazwa jest przycinana;
  - w kontekście placówki menu zawiera `Wróć do widoku osobistego`;
- mobile:
  - nie ma dodatkowego przycisku `Moje CRPE`;
  - `Panel CPD` nadal jest dostępny w głównej nawigacji.

### Admin → Szkolenia

- widoczne są zakładki:
  - `Wszystkie`;
  - `Nowe do decyzji`;
  - `Zmiany ze źródła`;
  - `Zapisy i miejsca`;
- w tabeli jest kolumna `Zapisy`;
- zmiana źródłowa pokazuje podgląd konkretnych pól, a nie tylko liczbę zmian;
- filtry `Data dodania` i `Termin szkolenia` działają niezależnie;
- `Wyczyść` faktycznie usuwa oba zakresy dat.

### Najważniejszy test bezpieczeństwa

Na **zaakceptowanym** szkoleniu z czysto operacyjną zmianą NIL:
1. zapamiętaj status szkolenia;
2. kliknij `Przyjmij zapisy`;
3. stan zapisów / limit miejsc powinien się zmienić;
4. szkolenie powinno pozostać `zaakceptowane`;
5. nie powinno zniknąć z publicznej bazy tylko z powodu tej zmiany.

Na zmianie mieszanej, np. `enrollment_status` + `points`:
1. otwórz porównanie;
2. kliknij `Zaznacz tylko operacyjne`;
3. zastosuj;
4. stan zapisów powinien się zmienić;
5. pole `points` powinno nadal pozostać w kolejce jako nierozstrzygnięte;
6. dopiero zastosowanie pola merytorycznego powinno cofnąć szkolenie do
   `do weryfikacji`.

## Decyzje produktowe v6.26

- nie wprowadzamy globalnej zasady `postęp = zielony`;
- `Moje CRPE` usuwamy również z menu mobilnego jako duplikat;
- `price_pln` nie jest polem operacyjnym;
- powiadomienia moderatora o zmianach merytorycznych odkładamy do osobnego
  etapu, po ustaleniu kanału, częstotliwości i deduplikacji.
