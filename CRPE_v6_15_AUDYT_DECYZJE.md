# CRPE v6.15 — decyzje do audytu katalogu szkoleń

Dokument odnosi się wyłącznie do repozytorium v6.14 przekazanego 8 sierpnia 2026 r.

| Uwaga | Status v6.15 | Rozwiązanie |
|---|---|---|
| Pełna tabela pobierana po każdym kliknięciu | Częściowo rozwiązane | Pierwszy widok jest SSR, a klient pobiera katalog najwyżej raz i filtruje natychmiast bez kolejnych requestów. Pełne filtry PostgreSQL i paginacja wymagają następnej migracji. |
| `slice(0, 200)` zaniża licznik | Wdrożone | Usunięto limit przed licznikiem; liczba odpowiada całemu pobranemu zbiorowi. |
| Wyszukiwanie bez ogonków | Wdrożone przejściowo | Normalizacja Unicode działa w JS. Docelowo `unaccent` + `tsvector` + GIN w bazie. |
| AbortController i debounce | Wdrożone adekwatnie | Początkowe zapytanie można anulować. Filtry lokalne reagują natychmiast, a zapis wyszukiwania w URL ma 300 ms debounce. |
| Filtry nie są w URL | Wdrożone | Parametry URL, usuwalne chippy i obsługa Wstecz. Kombinacje filtrów mają `noindex,follow`, aby nie tworzyć duplikatów SEO. |
| Brak strony szkolenia | Wdrożone | `/baza-szkolen/[slug]`, stabilne ID, canonical, metadata, Open Graph i linki z kart. |
| Brak JSON-LD | Wdrożone | `Course` oraz `CourseInstance`. |
| Statyczny sitemap i brak robots | Wdrożone | `app/sitemap.ts`, `app/robots.ts`; statyczny XML usunięty. |
| Brak SSR treści | Wdrożone | Publiczny katalog otrzymuje pierwsze dane z komponentu serwerowego. |
| Brak zawodu z profilu | Wdrożone | Zawód z `medical_professionals` jest domyślny, o ile URL nie wskazuje innego. |
| Jedna myląca liczba punktów | Wdrożone | Bez zawodu zakres, np. `2–6 pkt`; po wyborze zawodu właściwa reguła. Plan blokuje niejednoznaczny zapis bez zawodu. |
| Status weryfikacji tylko w szczegółach | Wdrożone | Widoczny na każdej karcie z ikoną i tekstem. |
| „Adresaci do weryfikacji” na wszystkich kartach | Wdrożone | Stan `unknown` nie tworzy alarmującego badge'a; w szczegółach użyto neutralnego „Adresaci niepodani”. |
| `null` ceny jako darmowe | Wdrożone | Bezpłatne wyłącznie przy `price_pln === 0`. |
| Trwające szkolenia znikają | Wdrożone | Aktualność według `end_date ?? start_date`. |
| Martwe „Nadchodzące” | Wdrożone | Checkbox usunięty; jeden spójny filtr terminu. |
| Cykliczna lista tematów | Wdrożone przejściowo | Słownik z pełnego pobranego katalogu, niezależny od wyników. Osobne zapytanie/tabela w etapie SQL. |
| Kolor dnia z pierwszego wydarzenia | Wdrożone | Dni wieloformatowe mają osobny kolor i legendę. |
| `null` punktów sortowane jak zero | Wdrożone | Brak danych zawsze na końcu. |
| Fonty CTA 9,5–10,5 px | Wdrożone | Przyciski karty mają 13 px i 40–44 px wysokości. |
| Odwrócona hierarchia CTA | Wdrożone | Primary: „Zapisy u organizatora”; secondary: „Dodaj do planu”. |
| Watermark logo | Wdrożone | Cały mechanizm proporcji, maski i blendowania usunięty. Ostre logo 32 px jest obok organizatora. |
| Punkty pozycjonowane `absolute` | Wdrożone | Stały grid karty. |
| `alert()` / `confirm()` | Wdrożone | Toast/status i walidacja inline. |
| Niedostępne modale | Wdrożone | Formularz ma focus trap, Escape, zwrot fokusu, `role="dialog"` i `aria-modal`. Modal szczegółów zastąpiła strona. |
| Brak `aria-live` | Wdrożone | Licznik i komunikaty są ogłaszane. |
| Brak skeletonów | Wdrożone | Skeleton pierwszego pobrania i `aria-busy`. |
| Kliknięcie w gap czyści kalendarz | Wdrożone | Usunięto handler kontenera; działa jawne „Pokaż wszystkie”. |
| Przycisk „Pokaż wyniki” | Wdrożone | Usunięty; filtry działają natychmiast. |
| Brak aktywnych filtrów | Wdrożone | Usuwalne chippy i „Wyczyść wszystkie”. |
| Inteligentny pusty stan | Zaplanowane | Najlepiej liczyć alternatywy po wdrożeniu serwerowego licznika, bez pobierania całej tabeli. |
| Zawsze cztery miesiące | Wdrożone | Tylko miesiące zawierające wydarzenia. |
| Kalendarz pod listą na mobile | Wdrożone | Collapsible przed wynikami; panel „Najbliżej” pozostaje desktopowy. |
| Anonimowe zgłoszenie | Decyzja produktowa | Bez zmian. Wymaga weryfikacji e-mail, ochrony antyspamowej, limitów i moderacji uploadów. |
| Brak godzin i stref czasowych | Wymaga SQL | Docelowe `starts_at` / `ends_at` z timezone. |
| Brak modelu cyklicznych edycji | Wymaga SQL | Docelowe `training_series` i `training_instances`. |
| Dwa źródła adresatów | Wymaga migracji | `training_profession_rules` jako źródło prawdy; tekst tylko jako legacy/snapshot. |

## Następny etap SQL

1. Funkcja/RPC publicznego wyszukiwania z filtrami, pełnym licznikiem i stabilnym kursorem `(starts_on, id)`.
2. `unaccent`, ważony `tsvector`, indeks GIN i testy zapytań bez polskich znaków.
3. Niezależny katalog tematów oraz testy RLS dla `anon` i `authenticated`.
4. Dopiero później rozszerzenie modelu o godziny, strefy i serie terminów.
