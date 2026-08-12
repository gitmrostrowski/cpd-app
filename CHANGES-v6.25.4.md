# CRPE v6.25.4 — spójność panelu CPD

- Widok „Przegląd” ma wyraźniejszy pasek postępu, skalę od 0 do celu oraz
  bezpiecznie pozycjonowaną etykietę „dziś”.
- Nagłówek sekcji statusu otrzymał ikonę zgodną z pozostałymi sekcjami panelu.
- Główna akcja zawsze używa granatowego koloru marki; pilność lub gotowość są
  sygnalizowane małą plakietką zamiast pełnego pomarańczowego albo zielonego tła.
- Limity okresowe pokazują wykorzystanie jako `wykorzystano / maksimum`, zgodnie
  z kierunkiem paska postępu i polem „Masz już”.
- Pozostały zapas jest opisany osobno i jednoznacznie jako „zostało … pkt”.
- Limit pojedynczego wpisu ma pełny opis jednostki, a podsumowanie kategorii
  pokazuje liczby w relacji do wszystkich kategorii.
- Zachowano dostępność widoku „Przegląd”: tekst kart nie jest ukrywany przed
  czytnikami ekranu.
- Aktualizacja nie zmienia obliczeń, danych, API, importera NIL ani schematu
  Supabase. Nie wymaga SQL-a, nowych sekretów ani zmiennych środowiskowych.
