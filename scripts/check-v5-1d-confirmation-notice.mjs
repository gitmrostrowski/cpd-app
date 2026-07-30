import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");

const login = read("app/login/page.tsx");
const registration = read("app/rejestracja/page.tsx");
const profile = read("app/profil/page.tsx");
const siteUrl = read("lib/siteUrl.ts");

const checks = [
  [
    "Logowanie rozpoznaje błąd niepotwierdzonego adresu",
    login.includes("isEmailNotConfirmedError") &&
      login.includes('setConfirmationNotice("required")'),
  ],
  [
    "Alert jasno informuje, że konto nie jest aktywne",
    login.includes("Konto nie jest jeszcze aktywne") &&
      registration.includes("Jeszcze jeden krok: potwierdź adres e-mail"),
  ],
  [
    "Alert pokazuje trzy kroki aktywacji",
    login.includes("Otwórz wiadomość aktywacyjną od CRPE") &&
      login.includes("Kliknij link potwierdzający konto") &&
      registration.includes("Po potwierdzeniu wrócisz do zaproszenia placówki"),
  ],
  [
    "Użytkownik otrzymuje wskazówkę o folderze Spam",
    login.includes("Sprawdź folder Spam, Oferty lub Inne") &&
      registration.includes("Sprawdź folder Spam, Oferty lub Inne"),
  ],
  [
    "Można ponownie wysłać wiadomość aktywacyjną",
    login.includes('type: "signup"') &&
      login.includes("supabase.auth.resend") &&
      registration.includes("supabase.auth.resend"),
  ],
  [
    "Ponowne wysłanie zachowuje powrót do zaproszenia",
    login.includes("emailRedirectTo: redirectTo") &&
      registration.includes("/auth/callback?next="),
  ],
  [
    "Alert ma semantykę dostępną dla czytników ekranu",
    login.includes('role="alert"') &&
      login.includes('aria-live="polite"') &&
      registration.includes('role="status"'),
  ],
  [
    "Linki uwierzytelniające używają produkcyjnego adresu strony",
    siteUrl.includes("NEXT_PUBLIC_SITE_URL") &&
      siteUrl.includes("https://www.crpe.pl") &&
      login.includes("getSiteUrl()") &&
      registration.includes("getSiteUrl()") &&
      profile.includes("getSiteUrl()"),
  ],
];

for (const [name, passed] of checks) {
  console.log(`${passed ? "OK" : "BŁĄD"} | ${name}`);
}

const failures = checks.filter(([, passed]) => !passed);
if (failures.length) {
  console.error(`\nNiepowodzenie: ${failures.length} z ${checks.length} testów.`);
  process.exit(1);
}

console.log(`\nCRPE v5.1d: ${checks.length}/${checks.length} testów OK.`);
