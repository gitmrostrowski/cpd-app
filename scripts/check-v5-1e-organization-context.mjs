import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const migration = read(
  "supabase/migrations/20260730_crpe_v5_1e_organization_context.sql",
);
const header = read("components/Header.tsx");
const profile = read("app/profil/page.tsx");
const selector = read("app/placowka/page.tsx");
const invitation = read("app/placowka/zaproszenie/page.tsx");
const login = read("app/login/page.tsx");
const registration = read("app/rejestracja/page.tsx");
const panel = read(
  "app/placowka/[organizationId]/OrganizationPanelClient.tsx",
);
const types = read("types/supabase.ts");

const checks = [
  [
    "Migracja wymaga jawnej zgody przy innym adresie",
    migration.includes("p_accept_different_email boolean default false") &&
      migration.includes(
        "Potwierdź przypisanie zaproszenia do konta używającego innego adresu e-mail",
      ),
  ],
  [
    "Istniejące konto zaproszonego adresu blokuje przejęcie",
    migration.includes("from auth.users") &&
      migration.includes(
        "Dla zaproszonego adresu istnieje już osobne konto CRPE",
      ),
  ],
  [
    "Audyt rozróżnia zgodny i inny adres bez zapisu adresu konta",
    migration.includes("invitation_email_match") &&
      migration.includes("existing_account_different_email") &&
      !migration.includes("'account_email'"),
  ],
  [
    "Strona zaproszenia pozwala świadomie użyć istniejącego konta",
    invitation.includes("Przypisz do obecnego konta") &&
      invitation.includes("p_accept_different_email") &&
      invitation.includes("use_existing=1"),
  ],
  [
    "Logowanie obsługuje konto pod innym adresem",
    login.includes('searchParams.get("use_existing") === "1"') &&
      login.includes("dotychczasowym koncie CRPE") &&
      login.includes("setEmailLocked(true)"),
  ],
  [
    "Rejestracja zachowuje alternatywę istniejącego konta",
    registration.includes("Masz już konto CRPE pod innym adresem?") &&
      registration.includes("use_existing=1"),
  ],
  [
    "Nagłówek pokazuje przełącznik Moje CRPE i placówki",
    header.includes("Moje CRPE") &&
      header.includes("Placówki i role") &&
      header.includes("organizationContexts.map"),
  ],
  [
    "Nagłówek używa inicjałów i zielonego statusu",
    header.includes("accountInitials") &&
      header.includes("bg-emerald-500") &&
      !header.includes("emailShort"),
  ],
  [
    "Jedna placówka otwiera się bez ekranu wyboru",
    selector.includes("nextContexts.length === 1") &&
      selector.includes(
        "router.replace(`/placowka/${nextContexts[0].organization_id}`)",
      ),
  ],
  [
    "Profil pokazuje sekcję Placówki i role",
    profile.includes('id="placowki-i-role"') &&
      profile.includes("aktywne członkostwo") &&
      profile.includes("get_my_organization_contexts"),
  ],
  [
    "Po dołączeniu panel pokazuje potwierdzenie",
    invitation.includes("?joined=1") &&
      panel.includes("Dołączyłeś do placówki") &&
      panel.includes("showJoinedNotice"),
  ],
  [
    "Typ RPC uwzględnia jawne potwierdzenie innego adresu",
    types.includes("p_accept_different_email?: boolean"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  if (!ok) failed += 1;
  console.log(`${ok ? "OK" : "BŁĄD"} — ${label}`);
}

if (failed) {
  console.error(`\nNieudane kontrole: ${failed}/${checks.length}`);
  process.exit(1);
}

console.log(`\nCRPE v5.1e: ${checks.length}/${checks.length} kontroli OK.`);
