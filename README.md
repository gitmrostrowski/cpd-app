# CRPE

Aplikacja Next.js do prowadzenia ewidencji aktywności edukacyjnych, punktów i dokumentów.

## Uruchomienie lokalne

1. Utwórz w głównym folderze plik `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj_publiczny_klucz_anon_lub_publishable
```

Nie używaj klucza `service_role`, `secret key` ani `sb_secret_...`.

2. Zainstaluj zależności:

```bash
npm ci
```

3. Uruchom aplikację:

```bash
npm run dev
```

4. Otwórz:

```text
http://localhost:3000
```

## Sprawdzenie wersji produkcyjnej

```bash
npm run build
npm run start
```

## Najważniejsze pliki strony publicznej

- `app/page.tsx` — strona główna,
- `components/Header.tsx` — nagłówek i nawigacja,
- `components/BottomCTA.tsx` — końcowe wezwanie do działania,
- `components/Footer.tsx` — stopka,
- `app/layout.tsx` — metadane i wspólny układ.

## Bezpieczeństwo

Pliki `.env*`, folder `node_modules` oraz folder `.next` są wykluczone z repozytorium. Przed wysłaniem zmian na GitHub sprawdź, czy `.env.local` nie znajduje się na liście zmienionych plików.

## Strona główna — wersja zwarta mobilnie

W tej wersji skrócono pierwszy ekran i cały rytm pionowy strony:

- wybór „Kim jesteś?” mieści się wysoko na pierwszym ekranie telefonu,
- trzy role są pokazane w jednym, zwartym rzędzie,
- na telefonie pełny dashboard zastępują trzy krótkie wskaźniki,
- sekcje, karty, FAQ, CTA i stopka mają mniejsze odstępy pionowe,
- powtarzające się komunikaty zostały skrócone,
- pełny podgląd panelu pozostaje widoczny na komputerze.

## Strona główna — wersja v4

Pierwszy ekran został przebudowany w jeden spójny układ produktowy:

- wybór roli jest lekkim przełącznikiem, a nie osobną dużą kartą,
- opis wybranej roli i korzyści są bezpośrednio pod przełącznikiem,
- panel po prawej ma formę okna aplikacji i zmienia się razem z rolą,
- widok placówki pokazuje konkretne braki w dokumentacji osób,
- uproszczono nawigację do: „Jak to działa”, „Dla kogo”, „Bezpieczeństwo” i „FAQ”,
- usunięto oznaczenie kroku „1 z 3” oraz drobne podpisy pod panelem.

## Animacje i interakcje

Po ponownej analizie prototypu wizualnego dodano oszczędne animacje produktowe:

- stopniowe wejście treści i panelu na pierwszym ekranie,
- miękkie przejście treści oraz dashboardu przy zmianie roli,
- rosnące paski postępu i sekwencyjne pojawianie się wierszy,
- delikatne unoszenie kart i paneli na urządzeniach z kursorem,
- pojawianie się sekcji dopiero po wejściu w obszar ekranu,
- cień nagłówka aktywowany po rozpoczęciu przewijania,
- pełna obsługa ustawienia systemowego `prefers-reduced-motion`.

Animacje nie wymagają dodatkowej biblioteki i są zdefiniowane w `app/globals.css`.

## Widoczność narzędzi — wersja v6

W tej wersji strona i nawigacja pokazują rzeczywisty zakres działającej aplikacji:

- publiczna strona główna prezentuje Panel CPD i kalkulator, Aktywności i certyfikaty, Raport użytkownika oraz Bazę szkoleń,
- po zalogowaniu główne menu zmienia się na bezpośrednie odnośniki do tych czterech narzędzi,
- narzędzia są widoczne także w menu mobilnym,
- Profil i ustawienia pozostają pod ikoną użytkownika,
- widok organizacji i funkcje organizatora są nadal jasno oznaczone jako rozwijane lub ustalane indywidualnie,
- Baza szkoleń jest opisana jako narzędzie do wyszukiwania i planowania; dodanie pozycji do planu nie oznacza zapisu u organizatora.

## Strona główna — układ zgodny z analizą v10

Treść strony publicznej została uporządkowana według zaakceptowanego materiału projektowego:

1. komunikat o dostępie do danych i szybkie akcje logowania/rejestracji,
2. wybór roli „Kim jesteś?” i porównanie trzech zakresów,
3. cztery kroki rozpoczęcia pracy,
4. ciemna sekcja pokazująca Panel CPD w praktyce,
5. pełny warsztat narzędzi dostępny po zalogowaniu,
6. FAQ,
7. końcowe CTA i stopka.

Przyciski w komunikacie startowym są dopasowane do stanu sesji: osoba zalogowana otrzymuje przejście do Panelu CPD i Bazy szkoleń, a osoba niezalogowana — logowanie i rejestrację.
