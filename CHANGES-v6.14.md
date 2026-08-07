# CRPE v6.14 — naturalne wtopienie logotypów

## Cel

Ujednolicenie prezentacji różnych logotypów organizatorów bez efektu osobnego,
przygaszonego obrazka położonego na karcie.

## Zmiany

- logo rozpoznaje proporcje pliku po załadowaniu: szerokie, standardowe,
  kwadratowe lub pionowe;
- szerokie logotypy tekstowe otrzymują większą czytelność;
- zwarte i pionowe sygnety mają łagodniejsze krycie, aby nie dominowały karty;
- eliptyczna maska wygasza obrzeża i usuwa prostokątny ślad pliku;
- tryb mieszania łączy kolor logo z chłodną tintą prawej części karty;
- poświata pod znakiem jest miękka i pozbawiona ramki;
- logo jest zakotwiczone przy prawym górnym narożniku i nie koliduje z
  punktacją ani przyciskami;
- zachowano układ akcji, ikonę punktów i zachowanie mobilne z v6.13.

## Wdrożenie

Nie ma zmian w bazie danych ani migracji SQL. Wystarczy podmienić kod aplikacji
i wdrożyć go jak poprzednią wersję.

## Kontrola

- pełna regresja v4–v6.14;
- TypeScript bez błędów;
- produkcyjny build 40 tras;
- dodatkowy test szerokich, kwadratowych i pionowych logotypów.
