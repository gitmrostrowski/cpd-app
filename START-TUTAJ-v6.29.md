# CRPE Home v6.29 (Home v15)
Nowy układ strony głównej oparty na produkcie. Hero pokazuje panel okresu z linijką: zdobyte punkty, certyfikaty i znacznik „dziś”, czyli tempo względem upływu czasu. Kolejne sekcje: trzy kroki, narzędzia w zakładkach, dla kogo (medyk jako główna ścieżka, placówka i organizator z uczciwym zakresem), czym CRPE jest i czym nie jest, FAQ oraz zamknięcie.

Home używa tego samego fontu (Plus Jakarta Sans z layoutu) i tych samych kolorów co aplikacja (#1D4ED8, #0B2545, semantyczne ok/warn). Montserrat i #3B5BFB zniknęły ze strony głównej. Wszystkie ilustracje są fragmentami interfejsu, bez zdjęć.

Zmienione: app/page.tsx, components/home/HomeFrame.tsx (skip link do treści).
Nowe: app/home-v15.css, scripts/check-v6-29-home.mjs.
Usunięte: components/home/HomeAudience.tsx.
Testy: check-home-rendering.cjs przepisany pod v15, check-release używa check-v6-29-home zamiast check-v6-28-14-home, check-v6-27-5 akceptuje kontener crpe-home-v15.
app/home-v14.css i zdjęcia w public/home zostają w repo jako historia, ale strona ich już nie używa. Można je usunąć w osobnym commicie.

Rozpakuj ZIP i skopiuj zawartość cpd-app-main do lokalnego repo GitHub Desktop, zastępując pliki. Usuń też components/home/HomeAudience.tsx, jeśli został lokalnie. Zachowaj .git i własne .env. Następnie commit i push. SQL nie jest potrzebny.
