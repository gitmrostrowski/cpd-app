# CRPE v6.27.4 — instrukcja wdrożenia

## Ważne

Ta wersja jest frontendowym dopracowaniem strony głównej. **Nie wymaga SQL, zmian Supabase, sekretów ani ustawień Vercel.**

## Zalecany branch

`feature/brand-led-home-v6.27.4`

## Zalecany commit

`CRPE v6.27.4 - brand-led landing i spokojniejsza hierarchia`

## Kolejność

1. Utwórz nowy branch z aktualnego `main` zawierającego v6.27.3.
2. Skopiuj zawartość pełnej paczki v6.27.4 do lokalnego repo.
3. Sprawdź, czy zmiany dotyczą strony głównej, BottomCTA, tokenów CSS i testów wersji.
4. Commit + Push.
5. Poczekaj na Vercel Preview / Ready.
6. Na Preview sprawdź trzy warianty: Medyk, Placówka, Organizator.
7. Dopiero po kontroli wizualnej utwórz PR do `main`.

## Checklist wizualny Preview

### Hero

- „w jednym miejscu.” jest czarne/grafitowe z cienkim niebieskim podkreśleniem,
- główny CTA jest zawsze `#1D4ED8`, niezależnie od roli,
- zmiana roli nie przemalowuje całej strony,
- aktywny tab ma miękki tint roli, bez dużej pełnej plamy koloru.

### Panel po prawej

- ikona/status identyfikują rolę,
- postęp i główne dane są brand blue,
- brak dokumentacji nie jest oznaczony amber tylko dlatego, że czegoś brakuje.

### Trzy role

- każda karta ma subtelny tint/akcent swojej roli,
- tylko wybrana karta ma główny wypełniony CTA,
- ten CTA jest zawsze brand blue,
- Organizator ma miękki fiolet, nie grafit wyglądający jak disabled.

### Jak to działa / FAQ

- kroki są kompaktową siatką na desktopie,
- numery kroków nie konkurują z CTA,
- FAQ ma neutralne kontrolki.

### Bottom CTA

- blok jest jedną rodziną niebieskiego,
- brak cyan/indigo dekoracji konkurujących z marką.

## Kontrole repo

- `npm run check:v6.27.4`
- `npm run check:v6.27.3`
- `npm run check:v6.27.2`
- `npm run check:v6.27.1`
- `npm run check:v6.27`

Ostateczne sprawdzenie TypeScript / Next build wykonuje Vercel Preview.
