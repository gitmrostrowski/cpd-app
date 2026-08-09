# CRPE v6.20 — terminy, tempo i czytelność wykresu

## Zakres

- plakietka tempa pokazuje różnicę w punktach zamiast w punktach procentowych;
- wykres ma środkową linię siatki, poziomą linię pomocniczą i odsuniętą etykietę różnicy;
- statyczny baner powiadomień zastępuje agenda trzech najbliższych planowanych aktywności;
- agenda pokazuje dokładny koniec okresu z PWZ i przypiętej, zweryfikowanej reguły;
- przy braku danych do dokładnego terminu stosowany jest jawnie opisany koniec roku;
- panel podaje wymagane średnie tempo roczne, o ile do końca zostały co najmniej dwa miesiące.

## Bezpieczeństwo dat

- daty ISO są walidowane bez automatycznej normalizacji nieistniejących dni;
- odliczanie używa dni kalendarzowych i nie zależy od zmiany czasu;
- dokładna data z PWZ nie jest stosowana w indywidualnym trybie okresu;
- termin miniony jest oznaczany jako „po terminie”.

## Dane i wdrożenie

Zmiana nie wymaga migracji SQL ani nowych zmiennych środowiskowych. Starsze
ukończone aktywności nadal są rozmieszczane na wykresie przybliżeniem, jeśli
baza nie zawiera ich dokładnej daty.
