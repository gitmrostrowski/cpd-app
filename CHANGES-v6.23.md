# CRPE v6.23 — limity form i oś aktywności

## Panel CPD

- przywrócono cztery zweryfikowane maksima dla lekarza i lekarza dentysty;
- limity pochodzą z `cpd_rule_requirements`, a nie ze stałej w interfejsie;
- limity są widoczne także przy własnym okresie, z jawną informacją, że reguła zawodu nie jest przypięta do cyklu;
- punkty przekraczające maksimum nie zwiększają wyniku ani wykresu;
- raport użytkownika stosuje te same maksima co Panel CPD;
- przy wpisie widoczna jest liczba punktów zaliczonych i — jeśli występuje nadwyżka — liczba wpisana przez użytkownika;
- karta ostatnich aktywności ma dwie kolumny, a po prawej kompaktową pionową oś czasu;
- oś odróżnia plan, wpis ukończony z brakami i wpis kompletny.

## Dane

- dodano osobne typy: szkolenie wewnętrzne, prenumerata czasopisma, członkostwo w towarzystwie/kolegium i platforma edukacyjna;
- migracja przypisuje istniejące wpisy na podstawie zachowanego tytułu;
- zapisano maksima z załącznika do Dz.U. 2022 poz. 464: 6 pkt za szkolenie wewnętrzne, 10 pkt za prenumeraty w okresie, 20 pkt za członkostwa w okresie i 10 pkt za konta edukacyjne w okresie.

## Wdrożenie

Przed wdrożeniem aplikacji uruchom migrację:

`supabase/migrations/20260809_crpe_v6_23_doctor_activity_limits.sql`
