# CRPE v6.25.2 — dokładniejsze pobieranie danych NIL

- Importer działa dwustopniowo: RSS dostarcza listę, a oficjalna strona
  szczegółowa NIL uzupełnia dane każdego szkolenia.
- Kod odbiorców NIL `34` jest mapowany na lekarzy i lekarzy dentystów; kod `33`
  pozostaje przeznaczony dla lekarzy dentystów.
- Parser rozpoznaje zakresy godzin zapisane jako `18002000`, `9001500` oraz
  `17:00 - 20:00`.
- Normalizowane są tytuły zawodowe prowadzących, między innymi `dr n. med.`,
  `dr hab. n. med.` i `r.pr.`.
- Strona szczegółowa uzupełnia poprawny tytuł, adresatów, format, prowadzących,
  lokalizację, punkty i status zapisów.
- Rozbieżność punktów między RSS a stroną szczegółową tworzy ostrzeżenie; punkty
  nadal nie są automatycznie oznaczane jako zweryfikowane.
- Awaria pojedynczej strony szczegółowej nie zatrzymuje całego importu. Importer
  używa danych RSS i dodaje ostrzeżenie `FALLBACK RSS`.
- Pełne opisy pozostają wyłączone domyślnie, a wszystkie nowe lub zmienione dane
  nadal wymagają decyzji moderatora.
- Aktualizacja nie wymaga migracji Supabase ani nowych sekretów GitHub.
