# CHANGES v6.27 — cieplejsza strona główna i dopracowane wykresy Panelu CPD

Data: 2026-08-15

Baza: CRPE v6.26.4

Test: `npm run check:v6.27`

## Cel

Ta wersja nie zmienia logiki biznesowej CRPE. Porządkuje warstwę wizualną w dwóch miejscach:

1. strona główna ma być mniej „klinicznie niebieska”, bardziej przyjazna i wyraźniej rozróżniać trzy role;
2. wykresy w Panelu CPD mają szybciej odpowiadać na pytania: ile mam punktów, gdzie powinienem być dziś i jaka część punktów pochodzi z kompletnych wpisów.

Inspiracją dla strony głównej była przesłana makieta offline. Zostały z niej zaczerpnięte przede wszystkim: różne akcenty kolorystyczne dla ról, miękkie tła i ilustracje ról. Nie kopiowano kodu bundlera ani zewnętrznych zależności z makiety.

## 1. Strona główna — cieplejsza, ale nadal CRPE

### Kolory ról

- **Medyk** — teal / morski;
- **Placówka** — niebieski marki;
- **Organizator** — fiolet.

Kolor aktywnej roli jest wykorzystywany w przełączniku roli, CTA, ikonach, subtelnych tłach i akcentach kart. Niebieski nie znika z produktu — pozostaje podstawowym kolorem marki i placówki — ale nie dominuje już każdego elementu strony.

### Hero

- delikatne, zależne od roli radialne rozświetlenia zamiast płaskiej niebieskości;
- ostatnia linia nagłówka przejmuje kolor aktywnej roli;
- CTA i znaczniki korzyści są spójne z wybraną rolą;
- tekst został lekko uproszczony i ocieplony bez obiecywania funkcji, których CRPE jeszcze nie ma.

### Karty „Dla kogo”

Dodano trzy lekkie ilustracje WEBP dostarczone w materiale referencyjnym:

- `public/home/role-medyk.webp`;
- `public/home/role-placowka.webp`;
- `public/home/role-organizator.webp`.

Karty mają spokojniejsze tła, większą głębię i akcent właściwy dla roli. Status faktycznej dostępności funkcji został zachowany.

## 2. Panel CPD — wykres „Przebieg”

Zachowano wykres schodkowy. To ważne semantycznie: punkty edukacyjne pojawiają się w konkretnych momentach po aktywnościach, a nie narastają płynnie pomiędzy datami.

Zmiany wizualne:

- mniej i delikatniejsze linie siatki;
- subtelne niebieskie wypełnienie pod schodkową linią zdobytych punktów;
- spokojniejsza linia równego tempa;
- mocniejszy marker „dziś”;
- bursztynowy pionowy odcinek pomiędzy wynikiem faktycznym a równym tempem na dziś;
- czytelna etykieta luki, np. `−27 pkt`, w małej pigułce;
- planowane punkty nadal są pokazywane osobno linią przerywaną;
- wykres zachowuje opis ARIA.

## 3. Panel CPD — „Przegląd”

- pasek postępu jest grubszy i czytelniejszy;
- niebieski oznacza zdobyte punkty;
- zielona dolna krawędź pokazuje część punktów pochodzącą z kompletnych wpisów;
- bursztynowe zakreskowanie pokazuje lukę do równego tempa na dziś;
- marker `dziś` jest wyraźniejszy;
- trzy KPI `Zebrane / Luka do tempa / Pozostaje` mają semantyczne akcenty i bardziej czytelną hierarchię typografii;
- zielony zakres nigdy nie może wyjść poza zakres punktów zdobytych, nawet przy niespójnych danych wejściowych.

## 4. Prawa kolumna statusu

Sekcja „Najpierw to / Co dalej” dostała bardzo delikatne neutralne tło. Dzięki temu zadania użytkownika są oddzielone od wykresu bez dokładania ciężkiej ramki.

## 5. Czego ta wersja nie zmienia

- Admin → Szkolenia z v6.26.4;
- importer NIL i jego workflow GitHub Actions;
- Supabase, funkcje RPC, RLS i migracje;
- logika wyliczania punktów, limitów i cykli CPD;
- sekrety, SMTP/Brevo i konfiguracja Vercela.

Nie dodano biblioteki wykresowej. Wykres pozostaje własnym SVG/React, dzięki czemu zachowujemy kontrolę nad semantyką i nie zwiększamy liczby zależności.

## 6. Walidacja przygotowanej paczki

W środowisku przygotowawczym bez `node_modules` wykonano:

- kontrolę składni TypeScript/TSX przez globalny TypeScript dla `app/page.tsx` i `app/panel-cpd/CalculatorClient.tsx` — **0 błędów składni**;
- `npm run check:v6.27` — **OK**;
- wszystkie dostępne historyczne `check:*` — **46/51 OK**.

Pięć wyjątków:

- `check:v6.19` — brak lokalnego pakietu `typescript`;
- `check:v6.23` — stary skrypt uruchamia `.ts` bez właściwego loadera;
- `check:v6.25` i `check:v6.25.1` — brak lokalnego `zod`;
- `check:v6.26.1` — test celowo oczekuje starego paska `h-4`, a v6.27 świadomie zwiększa jego wysokość dla czytelności. Nowsze kontrole `v6.26.2`, `v6.26.3`, `v6.26.4` i `v6.27` przechodzą.

Pełny `next build`, `eslint` i testy wymagające zależności należy potwierdzić na Vercel Preview / po `npm ci`.
