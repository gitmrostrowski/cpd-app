# CRPE v6.27.4 — brand-led landing i spokojniejsza hierarchia

Baza: **v6.27.3** z paczki `CRPE_v6_27_3_ROLA_WLASCICIELEM_AKCENTU_GOTOWE_2026-08-15(1).zip`.

## Cel

Usunąć konflikt pomiędzy kolorem marki i kolorami ról. Strona główna ma wyglądać jak jeden produkt SaaS z trzema ścieżkami, a nie jak trzy osobne motywy.

## 1. Jeden primary brand

- główny kolor marki i CTA: `#1D4ED8`, hover `#0F3CAB`,
- H1 jest neutralny (`#171A21`), a marka pojawia się jako cienkie podkreślenie pod „w jednym miejscu.”,
- CTA w hero i aktywnej karcie roli są identycznie niebieskie dla Medyka, Placówki i Organizatora,
- Bottom CTA jest jednolitym brandowym blokiem bez dodatkowego cyan/indigo.

## 2. Rola tylko jako lokalna tożsamość

Role nie przemalowują strony. Używają tylko miękkich tintów i małych akcentów:

- Medyk: soft `#E2F6F6`, border `#C6E6E6`, text `#00595D`,
- Placówka: soft `#EFF4FE`, border `#CFDDFB`, text `#1D4ED8`,
- Organizator: soft `#FBEEF9`, border `#EEDAEA`, text `#6D3967`.

Akcent roli występuje w aktywnym przełączniku, statusie, ikonie oraz ramie/pasku karty roli. Nie przejmuje CTA, wykresów ani elementów strukturalnych.

## 3. Panel hero bez konfliktu barw

- postęp i główne liczby w przykładowym Panelu Medyka korzystają z koloru marki,
- role identyfikuje wyłącznie nagłówek/status panelu,
- „Braki / Do uzupełnienia” są neutralną informacją, nie amber alertem.

## 4. Amber tylko dla roadmapy

Bursztyn pozostał przy komunikatach typu „Rozwijamy / Kolejny etap”. Zwykłe braki dokumentacji i informacje o aktywnościach nie używają amber na landingu.

## 5. Mniejsza konkurencja elementów drugorzędnych

- kroki „Jak to działa” zostały przebudowane na kompaktową siatkę 4 kart na desktopie,
- numery kroków nie są już pełnym niebieskim kołem konkurującym z CTA,
- kontrolki FAQ są neutralne i dopiero po otwarciu dostają miękki brand tint,
- sekcja kroków jest krótsza, dzięki czemu strona ma lepszy rytm pionowy.

## 6. Tokenizacja

Paleta landingu została przeniesiona do `@theme` w `app/globals.css`. `app/page.tsx` oraz `components/BottomCTA.tsx` nie zawierają już zahardkodowanych sześciocyfrowych hexów.

## Poza zakresem

Bez zmian pozostają:

- Panel CPD i wykresy z v6.27,
- Admin → Szkolenia v6.26.4,
- scraper/importer NIL,
- GitHub Actions dla NIL,
- Supabase i migracje SQL,
- sekrety i konfiguracja Vercel.
