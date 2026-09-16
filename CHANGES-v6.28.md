# CRPE v6.28 — nowy język wizualny „Punkty = kropki”

Zmiana wyłącznie wizualna. Treści strony głównej pozostały bez zmian
(wyjątek: opisy `alt` dla nowych zdjęć).

## Koncepcja
„Punkt” to po polsku także kropka. Kropki są jedynym motywem graficznym:
pierścień postępu wokół zdjęcia w hero, kropkowana ścieżka kroków,
morska kropka kończąca nagłówki, punktory list i etykiety sekcji.

## System (baza dla kolejnych podstron)
- `app/globals.css`: tokeny `crpe-navy`, `crpe-punkt(-text/-soft/-border)`, `crpe-ice`, `crpe-subtle`,
  cienie `shadow-crpe-soft/lift/cta`, promienie `rounded-crpe-lg/md`, klasy `crpe-dot-grid`,
  `crpe-dot`, `crpe-step-path`, animacja pierścienia (z `prefers-reduced-motion`).
  `crpe-brand` pozostaje jedynym kolorem CTA. Kolor organizatora zmieniony z szarego na granatowy,
  medyka na morski.
- `app/layout.tsx`: krój nagłówków Bricolage Grotesque (`--font-display-face`), treść bez zmian (Plus Jakarta Sans).
  Wszystkie `h1–h3` w aplikacji dostają nowy krój automatycznie.
- `components/ui/crpe.tsx` (nowy): `pill.primary/secondary/onDark/ghostOnDark`, `Eyebrow`, `SectionHeading`,
  `DotTitle`, `IconBadge`, `DotBullet`, `DotRing`, `DottedCurve`, `cx`.

## Strona główna
- Hero: zdjęcie roli w pierścieniu punktów (55% dla medyka), pływająca karta podglądu, przełącznik ról w formie pigułek.
- Karty ról ze zdjęciami ludzi zamiast martwych natur; ikony w okrągłych plakietkach.
- „Jak to działa”: okrągłe kroki połączone kropkowaną ścieżką.
- Sekcje granatowe (praktyka, pasek narzędzi, CTA, stopka) z rastrem kropek.
- Bezpieczeństwo: zdjęcie certyfikatu na tablecie.

## Wspólne komponenty
- `components/Footer.tsx`: granatowa stopka.
- `components/BottomCTA.tsx`: granatowy pas z plakietką roli.
- `components/Header.tsx`: pigułkowe przyciski, znak słowny „CRPE.” w kroju nagłówków (logika bez zmian).

## Zdjęcia (`public/home/`)
- `photo-medyk.webp` ← `lekarka_z_tabletem.png`
- `photo-placowka.webp` ← środkowy kadr `hero-medical.png`
- `photo-organizator.webp` ← `lekrze_konsyl_pion.png`
- `photo-dokument.webp` ← prawy kadr `hero-medical.png` (bez znaku wodnego)
- Stare `role-*.webp` nie są już używane na stronie głównej.
- Uwaga: `public/lekarka_z_tabletem_pion.png` jest uszkodzony (ucięty plik).

## Kontrole
- Nowa: `npm run check:v6.28`.
- Kontrole `check:v6.27.7`–`check:v6.27.10` dostosowano w wydaniu Home v6.28.1 do aktualnego wyglądu; zachowano zawarte w nich kontrole Panelu CPD i Bazy szkoleń.
- Zestaw kontroli dla aktualizacji: `npm run check:release`. Wyniki i ograniczenia opisuje `RELEASE-HOME-v6.28.1.md`.
