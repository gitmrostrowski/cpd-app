# CRPE v6.25.1

- Zmiany istniejących szkoleń trafiają do chronionej kolejki zamiast nadpisywać
  pola poprawione przez moderatora.
- Panel administratora pokazuje porównanie pól i pozwala zastosować wybrany
  podzbiór albo odrzucić propozycję.
- Odrzucony hash nie tworzy tej samej propozycji przy kolejnym cyklu.
- Po zastosowaniu zmiany rekord wraca do `pending` i wymaga finalnej akceptacji.
- Parser rozpoznaje wpisy z terminem do ustalenia i nie odrzuca ich jako
  historycznych.
- Województwo jest wyliczane wyłącznie dla form stacjonarnych i hybrydowych.
- Pobieranie RSS wysyła identyfikujący `User-Agent`.
- Endpoint egzekwuje limit 128 KB podczas odczytu strumienia.
- Pełne opisy NIL są domyślnie wyłączone do czasu potwierdzenia zasad
  wykorzystania treści.
- Migracja zawiera kontrolę zgodności tabeli `trainings` i osiem testów końcowych.
- Workflow używa aktualnych `actions/checkout@v7` i `actions/setup-node@v7`.
