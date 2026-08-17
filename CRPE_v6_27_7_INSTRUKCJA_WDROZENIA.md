# CRPE v6.27.7 — instrukcja wdrożenia

## Baza
Wersja została przygotowana na **v6.27.6**.

## Zalecany branch
`feature/home-visual-coherence-v6.27.7`

## Zalecany commit
`CRPE v6.27.7 - spójniejszy Home i role przez ikony`

## Wdrożenie
1. Utwórz nowy branch z aktualnego `main` zawierającego v6.27.6.
2. Skopiuj zawartość paczki v6.27.7 do lokalnego repo.
3. W GitHub Desktop sprawdź zakres zmian przed commitem.
4. Uruchom / pozwól GitHub/Vercel uruchomić build Preview.
5. Na Preview sprawdź kolejno Medyk → Placówka → Organizator.

## Check lokalny
`npm run check:v6.27.7`

## Co sprawdzić wizualnie
- H1: tylko „w jednym miejscu.” jest mocno niebieskie.
- Nad H1: brak badge/pigułki; jest mały niebieski eyebrow.
- RolePicker: tekst każdej roli ma stały ciemny kolor; zmienia się przede wszystkim kafelek ikony.
- Organizator: ikona czapki absolwenta zamiast generycznej osoby.
- Zakres i bezpieczeństwo oraz FAQ: identyczny pełnoszerokościowy separator górny.
- Strona nadal ma wspólne 1200 px z Header/Footer/Panel CPD/Bazą szkoleń.

## Brak zmian infrastrukturalnych
- SQL: NIE
- Supabase: bez zmian
- Vercel env: bez zmian
- GitHub Actions / NIL: bez zmian
