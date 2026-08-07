# CRPE v6.15.1 — czytelny kafelek szkolenia

## Zmienione

- Usunięto błąd przycinający etykietę „Zapisy u organizatora”.
- Akcje są ustawione pionowo w stabilnej szynie o szerokości 216 px.
- Usunięto dekoracyjny gradient pozostały po dawnym watermarku.
- Punkty i status ich weryfikacji tworzą jeden semantyczny blok.
- Ograniczono liczbę plakietek do formatu i konkretnej pilności terminu.
- Status zapisów przeniesiono do jednej, niełamanej linii metadanych.
- Usunięto dublujący link „Szczegóły”; tytuł pozostaje linkiem do szkolenia.
- Wzmocniono pasek koloru formatu z 2 px do 3 px.
- Data pokazuje dzień tygodnia, dzień, miesiąc i rok.
- Logo organizatora ma lekki wariant inline bez ramki i nadmiernego paddingu.
- Przy braku logo wyświetlane są inicjały organizatora.

## Zachowane

- zaokrąglone rogi zgodne z pozostałymi komponentami CRPE;
- zakres punktów zależny od zawodu i status weryfikacji;
- główna hierarchia CTA: zapisy u organizatora przed dodaniem do planu;
- responsywny układ pionowy na małych ekranach;
- wszystkie poprawki SEO, URL, SSR i dostępności z v6.15.

Wersja nie wymaga migracji SQL.
