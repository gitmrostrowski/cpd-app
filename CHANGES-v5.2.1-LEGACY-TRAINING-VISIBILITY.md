# CRPE v5.2.1 — widoczność historycznych szkoleń

## Naprawiony problem

Migracja v5.2 poprawnie pozostawiła niejednoznacznych adresatów jako `unknown`,
ale publiczna baza szkoleń odrzucała wszystkie takie rekordy. W rezultacie
starsze zatwierdzone szkolenia znikały z listy mimo że nadal istniały w bazie.

## Zachowanie po poprawce

- każde zatwierdzone szkolenie pozostaje widoczne;
- historyczne rekordy bez adresatów mają etykietę „Adresaci nieokreśleni —
  sprawdź opis szkolenia”;
- historyczna liczba punktów jest wyświetlana z informacją „do weryfikacji”;
- rekordy `unknown` są widoczne także przy filtrze zawodu, ale nie są fałszywie
  klasyfikowane jako szkolenia dla wszystkich;
- nowe szkolenia nadal nie mogą zostać zatwierdzone bez adresatów i statusu
  punktów;
- jednoznaczny stary opis dotyczący lekarzy i lekarzy dentystów jest mapowany
  do obu zawodów.

## Kolejność wdrożenia

1. Uruchom `20260801_crpe_v5_2_1_legacy_training_visibility.sql` w Supabase.
2. Sprawdź cztery wyniki `OK`.
3. Wgraj kod v5.2.1 do GitHuba i poczekaj na wdrożenie Vercel.
4. Sprawdź bazę szkoleń przy filtrach „Wszystkie” i „Dla mojego zawodu”.
