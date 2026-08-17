# CRPE v6.27.9 — dopracowanie hero + kompaktowy status Panelu CPD

Baza: **v6.27.8**.

## Home
- Przeniesiono napis „CRPE dla medyka, placówki i organizatora” z osi całego hero do prawej, produktowej kompozycji na desktopie. Na mobile pozostaje nad hero.
- Przełącznik Medyk / Placówka / Organizator dostał wyraźniejszą, neutralną szynę (`slate`) zamiast zlewać się z białą kartą.
- Teksty nazw ról są stałe i neutralne. Tożsamość roli niesie ikona:
  - aktywna: pełny kolor roli + biały piktogram,
  - nieaktywna: miękki tint roli + kolorowy piktogram.
- Zachowano brand blue dla H1 „w jednym miejscu.” i CTA.

## Panel CPD — „Twój status i kolejne kroki”
- Zmniejszono wysokość wykresu SVG z 224 do 188 jednostek oraz zredukowano marginesy osi.
- Zmniejszono główną liczbę punktów (maks. 44 px zamiast 52 px).
- Przełącznik `Przebieg / Przegląd` i „Tempo na dziś” są w jednym, zwartym toolbarze.
- Legenda pod wykresem jest lżejsza i nie używa trzech dużych pigułek.
- Długi opis wykresu zastąpiono krótką instrukcją interpretacji.
- Prawa kolumna „Najpierw to” jest samodzielną kartą wysokości treści, nie rozciąga się do wysokości wykresu.
- Akcje w prawej karcie są ciaśniejsze typograficznie i pionowo.

## Bez zmian
- logika obliczeń Panelu CPD,
- limity i aktywności,
- Baza szkoleń,
- Admin szkoleń,
- importer NIL,
- Supabase / SQL / workflow GitHub Actions.
