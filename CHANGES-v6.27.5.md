# CRPE v6.27.5 — wspólny layout 1200 px i semantyczny system kolorów

Baza: **CRPE v6.27.4 BRAND-LED HOME** przesłana 2026-08-17.

Zakres tej wersji wynika z briefu `CRPE_brief_ujednolicenie_layout_i_kolor.md` i nie zmienia logiki biznesowej, bazy danych ani importera NIL.

## 1. Jeden rytm szerokości w aplikacji

- dodano `lib/layout.ts` z `PAGE_MAX_W = 1200` i wspólnym `pageWrap`,
- strona główna korzysta z `pageWrap` z `@/lib/layout`,
- Header, Footer, BottomCTA, Panel CPD, Baza szkoleń, Aktywności i Panel placówki zostały ujednolicone do `max-w-[1200px]`,
- usunięto z `app/` i `components/` wszystkie pozostałe `max-w-[1180px]`, `max-w-[1220px]` i `max-w-[1280px]`.

## 2. Semantyczne tokeny stanu w `app/globals.css`

Dodano:

- success: `#006A4E`, soft `#E4F6F0`, border `#C5E3D9`,
- warning: `#9A4600`, soft `#FFEEE2`, border `#FAD6C0`,
- danger: `#A42F30`, soft `#FFECE9`, border `#FFCEC8`.

W komentarzu przy tokenach zapisana jest zasada: statusy semantyczne nie są kolorem CTA ani tożsamością roli; CTA korzystają z `crpe-brand`.

## 3. Panel CPD

`app/panel-cpd/CalculatorClient.tsx` został przeniesiony z surowych klas Tailwind na tokeny CRPE:

- blue → `crpe-brand*`,
- amber → `crpe-warning*`,
- emerald → `crpe-success*`,
- red → `crpe-danger*`.

Podmieniono również odpowiadające im kolory SVG, gradientów i cieni inline, zachowując znaczenie wykresów i stanów.

Neutralne `slate-*` pozostają bez zmian zgodnie z briefem.

## 4. Baza szkoleń

`app/baza-szkolen/TrainingHubClient.tsx` korzysta z tego samego systemu brand/status co Panel CPD.

Dodatkowo:

- `Zgłoś szkolenie` jest teraz brandowym CTA typu outline,
- format `Hybrydowe` nie używa już indigo — badge i kalendarz są neutralne `slate`,
- stary niebieski/amber/emerald/red został usunięty również ze strony szczegółu szkolenia, aby końcowa kontrola całego `app/baza-szkolen/` zwracała zero wyników.

## 5. Testy regresji

Dodano `npm run check:v6.27.5`.

Historyczne testy, które sprawdzały dosłowne klasy `blue-*`, `amber-*` lub `emerald-*`, zostały zaktualizowane do równoważnych tokenów semantycznych. Ich warunki funkcjonalne i strukturalne pozostały bez zmian.

W środowisku przygotowania paczki:

- `check:v6.27.5` — OK,
- łącznie `51/56` skryptów `check:*` — OK,
- pięć nieprzechodzących (`v6.19`, `v6.23`, `v6.25`, `v6.25.1`, `v6.26.1`) to dokładnie ten sam zestaw, który nie przechodzi na nietkniętej bazie v6.27.4 w tym środowisku,
- zmienione pliki TS/TSX przeszły parser TypeScript: 0 błędów składni.

`npm run lint` i `npm run build` nie mogły zostać uruchomione lokalnie, ponieważ dostarczone repo nie zawiera `node_modules` (`eslint` i `next` nie są dostępne w środowisku). Ostateczny build należy zweryfikować na Vercel Preview, który instaluje zależności.

## 6. Brak zmian poza zakresem

Bajt w bajt nie zmieniono:

- `app/admin/szkolenia/page.tsx`,
- `integrations/training-importer/src/sources/nil.ts`,
- `.github/workflows/import-nil-trainings.yml`,
- `supabase/migrations/20260813_crpe_v6_26_operational_import_fields.sql`.

Nie jest wymagany SQL ani zmiana konfiguracji Supabase, GitHub Secrets/Variables czy Vercel.
