# CRPE v6.15.4 — widoczność i edycja ceny

## Zakres

- Cena jest widoczna nad tytułem szkolenia, obok formatu.
- Bezpłatne szkolenia mają mocną zieloną plakietkę bez dodatkowej ikony.
- Płatne szkolenia pokazują neutralną plakietkę z kwotą w polskim formacie.
- Brak ceny jest jawnie opisany jako „Cena niepodana”.
- Pilność terminu została przeniesiona do kolumny daty, aby karta miała najwyżej dwie plakietki.
- Bezpłatna cena jest spójnie wyróżniona na stronie szczegółów.
- Formularz zgłoszenia rozróżnia: „Cena do potwierdzenia”, „Bezpłatne” i „Płatne”.
- Panel administratora pozwala ustawić ten sam stan i poprawić kwotę.
- Dla płatnego szkolenia formularz i panel wymagają kwoty większej od 0 zł.

## Dane i wdrożenie

Zmiana korzysta z istniejącej kolumny `price_pln`:

- `null` — cena do potwierdzenia,
- `0` — bezpłatne,
- wartość większa od `0` — płatne.

Nie ma migracji bazy danych ani skryptu SQL do uruchomienia.

## Weryfikacja

Nowy test regresyjny: `npm run check:v6.15.4`.
