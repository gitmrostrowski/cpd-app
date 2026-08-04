# CRPE v6.1 — opcjonalne logo organizatora

## Cel pakietu

Wersja v6.1 dodaje bezpieczne przesyłanie pliku logo organizatora przy
zgłaszaniu szkolenia. Logo jest opcjonalne. Jeśli go nie ma, kafelek zachowuje
dotychczasowy układ bez pustej ramki. Jeśli logo istnieje, pojawia się pod datą
w lewej kolumnie kafla.

## Co zmieniono

- formularz zgłoszenia przyjmuje PNG, JPG/JPEG albo WebP do 2 MB;
- serwer sprawdza rzeczywisty format i liczbę pikseli obrazu;
- serwer usuwa metadane, zmniejsza obraz do maks. 256 × 256 px i zapisuje WebP;
- pliki trafiają do publicznego bucketu `training-organizer-logos` pod losową
  nazwą; przeglądarka nie ma prawa bezpośredniego zapisu;
- rekord szkolenia przechowuje publiczny URL oraz niepubliczną ścieżkę pliku;
- administrator może zobaczyć, zastąpić lub usunąć logo;
- stare logotypy zapisane jako zewnętrzne adresy HTTPS nadal działają;
- poprawiono błąd, przez który organizator o nazwie `NIL` mógł zostać uznany za
  brak organizatora;
- okna dodawania i edycji przewijają się na mniejszych ekranach.

## Kolejność wdrożenia — ważne

Nie wgrywaj kodu na GitHub przed wykonaniem kroku 1. Nowy kod pobiera kolumnę
`organizer_logo_path`, więc migracja bazy musi być pierwsza.

### 1. Supabase

1. Otwórz właściwy projekt CRPE we Frankfurcie.
2. Otwórz SQL Editor i nowy pusty dokument.
3. Wklej cały plik:
   `supabase/migrations/20260804_crpe_v6_1_training_organizer_logos.sql`.
4. Uruchom skrypt jeden raz.
5. W tabeli wyników każdy test musi mieć wynik `OK`.
6. W Storage powinien pojawić się bucket `training-organizer-logos` oznaczony
   jako publiczny.

Publiczny bucket pozwala wyświetlać zatwierdzone logotypy bez logowania. Nie
oznacza to publicznego zapisu: kod nie tworzy polityk zapisu dla `anon` ani
`authenticated`.

### 2. Vercel

W projekcie produkcyjnym dodaj jedną tajną zmienną:

`SUPABASE_SERVICE_ROLE_KEY=<klucz service_role właściwego projektu Supabase>`

Ustawienia:

- Environment: `Production`;
- Sensitive: włączone;
- nazwa nie może mieć prefiksu `NEXT_PUBLIC_`.

Nie pokazuj wartości klucza na zrzutach ekranu, nie wklejaj jej do rozmowy,
GitHuba ani pliku `.env` dołączonego do paczki. Na tym etapie nie wykonuj
ręcznego redeployu, jeśli za chwilę aktualizujesz GitHub.

### 3. GitHub i automatyczny deployment

1. Wgraj zawartość katalogu repozytorium, nie cały katalog jako dodatkowy
   podfolder i nie sam plik ZIP.
2. Dopilnuj, aby na GitHubie znalazł się katalog `supabase/migrations`.
3. Nie wgrywaj `node_modules`, `.next`, `.env` ani żadnych kluczy.
4. Zaczekaj na automatyczne wdrożenie Vercela.
5. Deployment musi zakończyć się statusem `Ready`.

## Test po wdrożeniu

1. Zaloguj się do CRPE jako zwykły użytkownik.
2. Zgłoś szkolenie bez logo i sprawdź, czy trafia do moderacji.
3. Zgłoś drugie szkolenie z małym plikiem PNG/JPG/WebP.
4. Otwórz panel administratora i sprawdź podgląd obu zgłoszeń.
5. Zastąp logo przy drugim zgłoszeniu innym plikiem i zapisz.
6. Zatwierdź oba szkolenia.
7. W publicznej bazie szkolenie z logo powinno pokazać je pod datą, a szkolenie
   bez logo nie powinno mieć pustej ramki.
8. W panelu administratora usuń logo i sprawdź, czy znika także z publicznego
   kafla po odświeżeniu.
9. Sprawdź, czy powiadomienie o zgłoszeniu nadal trafia na
   `zgloszenia@crpe.pl`.

## Kontrola lokalna

```bash
npm install
npm run check:v6
npm run check:v6.1
npx tsc --noEmit
npm run build
```

Zmienne wymagane przez upload logo:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY` — tylko serwer;
- dotychczasowe zmienne Brevo i adresów e-mail pozostają bez zmian.

## Cofnięcie wdrożenia

W razie problemu można przywrócić wcześniejszy commit aplikacji. Nowa kolumna i
bucket są zgodne wstecznie, więc nie trzeba ich usuwać podczas cofania kodu.
Nie usuwaj bucketu, jeśli znajdują się w nim logotypy używane przez rekordy.
