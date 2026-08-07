# CRPE v6.15 — poprawność katalogu, SEO, UX i dostępność

## Wdrożone bez migracji bazy

- SSR pierwszego widoku publicznego katalogu.
- Linkowalne strony `/baza-szkolen/[slug]` oparte na stabilnym ID szkolenia.
- Unikalne metadata, canonical, Open Graph oraz JSON-LD `Course` / `CourseInstance`.
- Dynamiczne `app/sitemap.ts` i `app/robots.ts`; usunięty statyczny `public/sitemap.xml`.
- Filtry w URL, obsługa Wstecz, automatyczne filtrowanie i aktywne chippy.
- Wyszukiwanie tolerujące brak polskich znaków po stronie klienta.
- Cena `null` nie jest traktowana jako bezpłatna.
- Trwające szkolenia pozostają w wynikach do daty końca.
- Brak punktów jest zawsze sortowany za rekordami z punktami.
- Tematy są budowane z pełnego katalogu, a nie z już przefiltrowanej listy.
- Domyślny zawód zalogowanego użytkownika jest pobierany z profilu, o ile URL nie wskazuje innego.
- Bez zawodu karta pokazuje zakres punktów; z zawodem pokazuje regułę właściwą dla tego zawodu.
- Status weryfikacji punktów jest widoczny bezpośrednio na karcie.
- Watermark zastąpiony ostrym logo obok organizatora; punkty są w stabilnym gridzie.
- Główne CTA to zapisy u organizatora; przyciski funkcjonalne mają co najmniej 13 px.
- Usunięte `alert()` i `confirm()`; dodane komunikaty nieblokujące i walidacja inline.
- Formularz zgłoszenia ma focus trap, Escape, `role="dialog"` oraz `aria-modal`.
- Wyniki mają `aria-live`, `aria-busy` i skeleton pierwszego ładowania.
- Kalendarz pokazuje wyłącznie miesiące z wydarzeniami, rozpoznaje dni wieloformatowe i jest dostępny nad wynikami na mobile.

## Świadomie niewdrożone w tej paczce

- filtrowanie i liczenie po stronie PostgreSQL;
- `unaccent` + `tsvector` + GIN;
- paginacja kursorowa;
- osobna tabela tematów;
- godziny i strefy czasowe;
- serie i wiele terminów jednego szkolenia;
- anonimowe zgłaszanie szkoleń.

Te elementy wymagają oddzielnej migracji SQL, testów RLS lub decyzji produktowej.
