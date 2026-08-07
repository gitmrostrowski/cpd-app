# CRPE v6.4 — UX/UI bazy szkoleń

## Zakres

- przeniesiono „Zgłoś szkolenie” do nagłówka strony;
- usunięto z nagłówka powielone „Aktywności” i ręczne „Odśwież”;
- przeniesiono „Więcej filtrów” do nagłówka formularza;
- zastąpiono „Filtruj” czytelniejszym „Pokaż wyniki”;
- dodano „Wyczyść” przywracające bezpieczne wartości domyślne;
- przeniesiono liczbę wyników i sortowanie nad listę szkoleń;
- dodano techniczne powiązania `label`, `id` i `name` dla filtrów;
- poszerzono kolumnę działań na kartach;
- ujednolicono przyciski „Przejdź do zapisów” i „Dodaj do planu”;
- doprecyzowano oznaczenia typu „+6 tematów”;
- uproszczono panel podsumowania po prawej stronie;
- zachowano mobilne cele dotykowe o wysokości co najmniej 44 px.

## Bez zmian w danych

Wersja v6.4 nie zawiera nowej migracji Supabase. Zachowuje model zawodów,
punktów i weryfikacji wdrożony w v6.3.

## Kontrola

```bash
npm run check:v6.4
npx tsc --noEmit
```

