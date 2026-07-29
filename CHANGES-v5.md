# CRPE v5 — panel placówki i model dostępu

## Zakres

V5 uruchamia pierwszy działający panel placówki:

- przełącznik `Moje CRPE / Placówka`;
- placówka pilotażowa przypisana pierwszemu aktywnemu administratorowi platformy;
- pulpit placówki;
- lista członków;
- struktura jednostek;
- zaproszenia ważne 14 dni;
- role organizacyjne i role ograniczone do jednostki;
- wstrzymywanie i przywracanie członkostwa;
- historia zmian dostępu;
- przekierowanie starego raportu organizacji do nowego panelu;
- mniejsza informacja o regule prawnej w kalkulatorze.

## Zasada nadawania dostępu

Każda osoba loguje się własnym kontem CRPE. Dostęp jest tworzony przez
zaproszenie na konkretny adres e-mail. Osoba przyjmująca zaproszenie musi być
zalogowana kontem o tym samym adresie.

Sam fakt członkostwa w placówce nie udostępnia aktywności ani certyfikatów.
Udostępnianie danych pracownika pozostaje oddzielnym procesem.

## Poziomy

1. **Organizacja** — właściciel i administrator zawsze działają w całej
   placówce. Koordynator, weryfikator i odbiorca raportów mogą również otrzymać
   rolę ogólną.
2. **Jednostka** — koordynator, weryfikator i odbiorca raportów mogą zostać
   ograniczeni do konkretnego oddziału, działu albo zespołu.
3. **Dane pracownika** — widoczność aktywności i dokumentów wynika dodatkowo z
   dobrowolnego udostępnienia, nie tylko z roli.

Nie należy tworzyć osobnych, ręcznie składanych uprawnień dla pojedynczych
użytkowników. Uprawnienia są przypisane do ról w jednej macierzy.

## Role

| Rola | Poziom | Najważniejszy zakres |
| --- | --- | --- |
| Właściciel | cała placówka | pełna kontrola, administratorzy i właściciele |
| Administrator | cała placówka | zespół, zaproszenia, jednostki i role operacyjne |
| Koordynator | placówka lub jednostka | widok zespołu, kompletność i raporty |
| Weryfikator | placówka lub jednostka | udostępnione aktywności i dokumenty |
| Odbiorca raportów | placówka lub jednostka | raporty bez zarządzania personelem |
| Pracownik | własne konto | własna ewidencja i decyzja o udostępnianiu |

Administrator nie może nadać ani odebrać roli właściciela. Tylko właściciel
może utworzyć administratora. Baza nie pozwala usunąć ostatniego aktywnego
właściciela.

## Wdrożenie

1. Uruchom w Supabase Frankfurt migrację
   `supabase/migrations/20260729_crpe_v5_organization_panel.sql`.
2. Sprawdź 12 wyników `OK`.
3. Wdróż kod aplikacji.
4. Zaloguj się kontem aktywnego administratora platformy.
5. Otwórz `/placowka`.

## Test lokalny

```bash
npm run check:v4
npm run check:v5
npx tsc --noEmit
```

Pełny `next build` może w obecnym środowisku roboczym zatrzymać się na znanym
błędzie systemowym `uv_resident_set_memory`; nie jest to błąd TypeScript ani
konkretnej strony v5.
