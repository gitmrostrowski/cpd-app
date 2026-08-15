# CRPE v6.27.3 — instrukcja wdrożenia

## Baza

Paczka jest przygotowana **bezpośrednio z v6.27.2**.

## Zakres

Zmiana dotyczy tylko strony głównej i testów regresyjnych palety. Nie ma nowego SQL-a ani zmian danych.

## Rekomendowany branch

`feature/role-owned-accents-v6.27.3`

## Rekomendowany commit

`CRPE v6.27.3 - kolor CTA i paneli zgodny z rola`

## Kolejność

1. Utwórz branch z aktualnego `main` zawierającego v6.27.2.
2. Skopiuj zawartość repo v6.27.3 do lokalnego repozytorium.
3. Sprawdź listę zmienionych plików.
4. Commit i Push na branch.
5. Poczekaj na **Vercel Preview / Ready**.
6. Na Preview przełącz szybko: `Medyk → Placówka → Organizator`.
7. Sprawdź osobno desktop i mobile.
8. Dopiero po akceptacji wizualnej utwórz/merge Pull Request do `main`.

## Co sprawdzić wizualnie

### Hero

- `w jednym miejscu.` ma zawsze kolor `#14355E`;
- CTA Medyka jest petrolowe;
- CTA Placówki stalowoniebieskie;
- CTA Organizatora ciemno-grafitowe;
- tło i H1 nie zmieniają motywu przy przełączaniu roli.

### Podgląd Medyka

- pasek postępu i `90 pkt` są petrolowe;
- tor paska jest jasno-petrolowy;
- `Certyfikaty` nie ma już błękitnej ikony;
- nie ma zielonej plakietki dostępności.

### Trzy role

- tylko wybrana karta ma wypełniony przycisk;
- jego kolor odpowiada wybranej roli;
- `Wybrana rola` i wypełniony CTA są na tej samej karcie.

### Stany

- dostępność = tint roli;
- rozwijamy = bursztyn;
- brak zieleni na stronie głównej.

## Kontrole lokalne / CI

Uruchom co najmniej:

```bash
npm run check:v6.27.3
npm run check:v6.27.2
npm run check:v6.27.1
npm run check:v6.27
npm run check:v6.26.4
npm run check:v6.26.3
```

Ostatecznym testem TypeScript/Next jest Vercel Preview.

## SQL / Supabase / sekrety

- nowy SQL: **NIE**;
- zmiany Supabase: **NIE**;
- nowe sekrety: **NIE**;
- zmiana `NIL_IMPORT_ENABLED`: **NIE**;
- zmiana workflow importera NIL: **NIE**.
