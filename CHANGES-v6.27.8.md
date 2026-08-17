# CRPE v6.27.8 — balans Home i Panelu CPD

Data: 2026-08-17

Baza: CRPE v6.27.7.

## Cel
Dopolerowanie dwóch miejsc widocznych na Vercel Preview:
1. zbyt duża pusta przestrzeń po prawej stronie karty „Twój status i kolejne kroki” w Panelu CPD,
2. powtarzające się i mało charakterystyczne ikony ról w hero strony głównej.

## Strona główna
- eyebrow „CRPE dla medyka, placówki i organizatora” został przeniesiony na środek ponad całe hero,
- przełącznik ról i podgląd CRPE na desktopie są teraz jedną, wspólną kompozycją w jednej ramce,
- w nagłówku podglądu usunięto drugi, powtarzający się duży kafel ikony roli; rolę oznacza subtelna kropka koloru,
- teksty Medyk / Placówka / Organizator pozostają zawsze w tym samym kolorze,
- w przełączniku tylko ikona aktywnej roli dostaje jej tint; ikony nieaktywnych ról są neutralne,
- petrol Medyka został lekko ochłodzony i rozjaśniony:
  - soft `#EAF6F7`,
  - border `#CBE3E5`,
  - text `#0F6B73`,
- H1 i brand blue pozostają bez zmian: „w jednym miejscu.” nadal jest niebieskie.

## Panel CPD
- główna kolumna wykresu dostała więcej miejsca,
- panel „Najpierw to” został zwężony i wyrównany do góry,
- usunięto efekt dużej pustej przestrzeni nad pierwszą akcją,
- tło bocznego panelu korzysta z `crpe-surface`.

## Bez zmian
- logika obliczeń CPD,
- dane i statusy,
- importer NIL,
- Admin szkoleń,
- Baza szkoleń,
- Supabase / SQL / sekrety.

## Walidacja
- `npm run check:v6.27.8` — OK,
- `npm run check:v6.27.7` — OK,
- `npm run check:v6.27.5` — OK,
- parser TypeScript dla `app/page.tsx` i `app/panel-cpd/CalculatorClient.tsx` — 0 błędów.

Starsze checki wizualne v6.27.4/v6.27/v6.26.2 oczekują literalnie poprzednich tokenów lub poprzedniej siatki i są historycznie nieaktualne po tej świadomej zmianie.
