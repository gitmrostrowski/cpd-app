# CHANGES v6.26.3 — hotfix testów automatycznego importera NIL

Data: 2026-08-14
Zakres: wyłącznie testy importera NIL i kontrola regresji.

## Przyczyna

Po włączeniu `NIL_IMPORT_ENABLED=true` harmonogram GitHub Actions zaczął wykonywać właściwe zadanie importera, ale workflow zatrzymywał się na `npm test`.

Dwa nowe testy z v6.26 używały bardzo krótkich sztucznych stron HTML:

- `REKRUTACJA ZAKOŃCZONA`,
- `BRAK MIEJSC`,
- krótki tekst bez rozpoznanego statusu zapisów.

Funkcja produkcyjna `enrichNilTraining()` celowo odrzuca stronę szczegółową, jeżeli oczyszczony tekst ma mniej niż 100 znaków. Testy wpadały więc w zabezpieczenie `strona szczegółowa NIL jest pusta` zanim dochodziły do sprawdzenia regexów statusu zapisów.

## Poprawka

W `integrations/training-importer/test/nil.test.ts` dodano helper `nilDetailHtml(message)`, który generuje realistyczny, dłuższy dokument strony szczegółowej NIL. Trzy przypadki testowe korzystają teraz z tego helpera.

Nie zmieniono produkcyjnego parsera ani progu 100 znaków. Zabezpieczenie przed pustą/niepełną odpowiedzią NIL pozostaje bez zmian.

Dodano `npm run check:v6.26.3`, który sprawdza m.in. że:

- testy nie wróciły do krótkich HTML-i,
- używają helpera realistycznej strony,
- produkcyjny próg `pageText.length < 100` nadal istnieje.

## Wdrożenie

Ta wersja nie wymaga SQL-a, zmian Supabase, sekretów, GitHub Variables, Vercela ani Brevo.

Po wdrożeniu kodu należy poczekać na następne automatyczne uruchomienie workflow `Import szkoleń — NIL` albo — tylko jeśli świadomie chcemy przetestować od razu — uruchomić workflow ręcznie. Oczekiwany wynik: `npm test` przechodzi 9/9 i workflow przechodzi dalej do `npm run import:nil`.
