# CRPE v6.5 — dopracowanie filtrów i punktów

## Zakres

- połączono „Więcej filtrów”, „Wyczyść” i „Pokaż wyniki” w jeden górny
  pasek działań;
- zachowano hierarchię przycisków: opcja dodatkowa, dyskretny reset i jedno
  główne CTA;
- usunięto pusty dolny pas formularza, dzięki czemu panel filtrów jest niższy;
- dodano responsywny układ działań na telefonie;
- przebudowano prezentację punktów w kartach na osobny, wyraźny moduł;
- dodano ikonę biretu oraz większą liczbę punktów;
- usunięto z listy techniczny komunikat „niezweryfikowane”;
- pozostawiono informację o pochodzeniu punktów w szczegółach szkolenia oraz
  w opisach dostępności;
- potwierdzone punkty otrzymały dyskretny zielony znak;
- komunikat o punktacji w szczegółach ma spokojny, informacyjny wygląd.

## Bez zmian w danych

Wersja v6.5 nie zawiera nowej migracji Supabase. Zachowuje model zawodów,
punktów i weryfikacji wdrożony w v6.3.

## Kontrola

```bash
npm run check:v6.5
npx tsc --noEmit
npm run build
```

