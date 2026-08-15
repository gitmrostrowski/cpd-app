# CHANGES v6.27.3 — kolor należy do roli, nie do całego motywu

Data: 2026-08-15
Baza: **v6.27.2**
Zakres produkcyjny: `app/page.tsx`
Test: `npm run check:v6.27.3`

## Cel

v6.27.2 uporządkowała rodzinę kolorów ról (petrol / stal / grafit), ale w hero nadal występowały dwa niezależne ogniska: pełny błękit marki po lewej oraz kolor roli po prawej. Najbardziej było to widoczne dla Medyka. v6.27.3 porządkuje własność koloru:

- elementy **stałe dla marki** pozostają niezmienne;
- elementy prowadzące do **konkretnej roli** mogą przejąć kolor tej roli;
- zielony nie jest już używany na stronie głównej jako zwykły status dostępności;
- bursztyn pozostaje dla funkcji rozwijanych / wymagających uwagi.

## 1. Hero — jedno ognisko na raz

### H1

Fraza `w jednym miejscu.` nie używa już pełnej chromy `#1D4ED8`. Otrzymała stały, głęboki atrament:

- `#14355E`

H1 nie zmienia koloru po przełączeniu roli. Emfaza wynika z kroju i wagi, a nie z konkurującej chromy.

### CTA

Główny przycisk hero należy do aktualnie wybranej roli:

- Medyk: `#16656B` → hover `#0E4448`;
- Placówka: `#23528F` → hover `#14355E`;
- Organizator: `#2E3247` → hover `#24283A`.

Organizator celowo używa ciemnego grafitu jako primary CTA — nie jest to stan disabled.

## 2. Panel Medyka — usunięty konflikt petrol / błękit

W podglądzie po prawej:

- pasek postępu: `#16656B`;
- tor paska: `#E7F0F0`;
- karta `Brakuje` używa petrolowego tintu i liczby `90 pkt` w `#16656B`;
- karta `Twój postęp` otrzymała neutralno-petrolowe tło zamiast błękitnego;
- ikona `Certyfikaty` używa petrolowego tintu zamiast jasnego brand blue.

Analogiczną zasadę zastosowano w podglądach Placówki i Organizatora: dostępne elementy wewnątrz panelu używają własnej rodziny roli, a nie przypadkowego błękitu lub zieleni.

## 3. Dostępność — bez zieleni na landingu

Na stronie głównej nie ma już klas `emerald` / `green`.

Dwa stany:

1. **Dostępne** — jasny tint roli + jej ciemny tekst;
2. **Rozwijamy / wymaga uwagi** — bursztyn.

Przykłady:

- Medyk: `#E7F0F0` / `#0E4448`;
- Placówka: `#E9EEF7` / `#14355E`;
- Organizator: `#EDEEF3` / `#2E3247`.

Dotyczy to hero, kart ról, podglądów modułów i sekcji zakresu. Zielone oznaczenia dostępności zostały zastąpione tintami ról. Bursztynowe komunikaty `rozwijamy` pozostają.

## 4. „Trzy role” — CTA podąża za wyborem

W sekcji kart ról:

- tylko karta aktualnie wybranej roli ma wypełniony CTA;
- wypełniony CTA używa koloru tej roli;
- pozostałe CTA są neutralne i nie konkurują z aktywnym stanem;
- plakietka `Wybrana rola` i wypełniony przycisk wskazują teraz tę samą kartę.

## 5. Czego nie zmieniono

v6.27.3 **nie zmienia**:

- wykresów Panelu CPD wprowadzonych w v6.27;
- `app/panel-cpd/CalculatorClient.tsx`;
- Admin → Szkolenia z v6.26.4;
- scrapera NIL;
- workflow GitHub Actions importera NIL;
- Supabase ani migracji SQL;
- sekretów ani konfiguracji Vercela.

## 6. Testy

Dodano:

`npm run check:v6.27.3`

Test pilnuje m.in.:

- stałego H1 `#14355E`;
- CTA hero zależnego od roli;
- petrolowego panelu Medyka;
- spójnych paneli Placówki i Organizatora;
- CTA aktywnej karty podążającego za wybraną rolą;
- braku zieleni na landingu;
- pozostawienia bursztynu dla stanów rozwijanych;
- braku regresji wykresów v6.27.

Testy v6.27.1 i v6.27.2 zostały uogólnione semantycznie, aby pilnowały swoich zasad bazowych bez wymuszania celowo zastąpionego H1/CTA z poprzedniej wersji.
