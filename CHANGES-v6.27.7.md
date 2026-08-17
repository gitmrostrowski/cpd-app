# CRPE v6.27.7 — Home: spójność wizualna pierwszego ekranu

Baza: **v6.27.6**.

Zakres tej wersji jest celowo ograniczony do strony głównej. Panel CPD, Baza szkoleń, Admin, importer NIL i SQL pozostają bez zmian.

## Dlaczego

Po wdrożeniu v6.27.6 landing nadal miał kilka sygnałów wizualnych konkurujących ze sobą:
- H1 stracił czytelny brandowy akcent,
- przełącznik Medyk / Placówka / Organizator barwił tekst razem z rolą, przez co cała kontrolka wyglądała niespójnie,
- ikona Organizatora była zbyt ogólna,
- górny badge hero wyglądał inaczej niż spokojne eyebrow na stronach Narzędzia/Pomoc,
- Zakres i bezpieczeństwo oraz FAQ nie miały identycznego pełnoszerokościowego separatora sekcji.

## Zmiany

### Hero
- usunięty pill/badge „CRPE dla medyków i organizacji”,
- zastąpiony prostym brandowym eyebrow: **„CRPE dla medyka, placówki i organizatora”**,
- „**w jednym miejscu.**” ponownie w kolorze `crpe-brand`, bez dekoracyjnego underline,
- subtelny, stały brandowy radial tint w tle hero — niezależny od wybranej roli,
- panel podglądu ma spokojniejszy cień i promień narożnika.

### Przełącznik ról
- tekst **Medyk / Placówka / Organizator** ma zawsze ten sam kolor `crpe-ink`,
- tożsamość roli niesie przede wszystkim kafelek ikony,
- aktywna ikona: pełny kolor roli + biały symbol,
- nieaktywna ikona: miękki tint roli,
- aktywny tab: neutralna biała powierzchnia i subtelny cień — bez przemalowania tekstu,
- Organizator używa `GraduationCap` zamiast generycznego `UserRound`.

### Karty „Trzy role”
- neutralne tło ilustracji i wspólna geometria,
- mocniejsza ikona tylko dla aktualnie wybranej roli,
- stan „Wybrana rola” wykorzystuje brand blue zamiast trzeciego sygnału koloru roli,
- nieco mniejsze narożniki i cienie — bliżej estetyki Centrum pomocy.

### Sekcje Zakres i bezpieczeństwo / FAQ
- oba bloki zaczynają się identycznym pełnoszerokościowym `border-t border-crpe-line`,
- oba mają ten sam pionowy rytm `py-12 sm:py-16`,
- eyebrow sekcji jest brand blue, zgodnie z językiem wizualnym Narzędzi i Centrum pomocy,
- tła mogą się naprzemiennie różnić (`white` / `surface`), ale separator i szerokość są identyczne.

## Pliki produkcyjne
- `app/page.tsx`
- `app/globals.css`

## Pliki kontroli / dokumentacji
- `scripts/check-v6-27-7-home-visual-coherence.mjs`
- `package.json`
- `CHANGES-v6.27.7.md`
- `CRPE_v6_27_7_INSTRUKCJA_WDROZENIA.md`

## Poza zakresem
- Panel CPD i wykresy — bez zmian,
- Baza szkoleń — bez zmian,
- Admin → Szkolenia — bez zmian,
- importer NIL / GitHub Actions — bez zmian,
- Supabase / SQL — bez zmian.
