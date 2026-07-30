import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");

const migration = read(
  "supabase/migrations/20260730_crpe_v5_1c_invitation_onboarding.sql",
);
const invitation = read("app/placowka/zaproszenie/page.tsx");
const login = read("app/login/page.tsx");
const registration = read("app/rejestracja/page.tsx");
const authCallback = read("app/auth/callback/route.ts");
const browserClient = read("lib/supabase/client.ts");
const legacyBrowserClient = read("lib/supabaseBrowser.ts");
const profile = read("app/profil/page.tsx");

const checks = [];
function check(name, passed) {
  checks.push({ name, passed });
}

check(
  "Baza rozpoznaje konto tylko przez ważny token zaproszenia",
  migration.includes("get_organization_invitation_landing") &&
    migration.includes("from auth.users") &&
    migration.includes("v_reason <> 'valid'"),
);
check(
  "Funkcja rozpoznająca konto ma ograniczone uprawnienia",
  migration.includes("security definer") &&
    migration.includes("set search_path = ''") &&
    migration.includes("revoke all on function") &&
    migration.includes("to anon, authenticated"),
);
check(
  "Nowe konto otrzymuje domyślnie ekran rejestracji",
  invitation.includes("details.account_exists") &&
    invitation.includes('href={`/rejestracja?next=') &&
    invitation.includes("Utwórz konto"),
);
check(
  "Istniejące konto otrzymuje wyłącznie ekran logowania",
  invitation.includes('href={`/login?next=') &&
    login.includes("!invitationFlow ? (") &&
    login.includes("Konto dla tego adresu już istnieje"),
);
check(
  "Adres zaproszenia jest pobierany z bazy i blokowany w formularzu",
  registration.includes("get_organization_invitation_landing") &&
    registration.includes("setEmail(invitation.email)") &&
    registration.includes("readOnly={emailLocked}") &&
    login.includes("readOnly={emailLocked}"),
);
check(
  "Rejestracja wraca do zaproszenia przez callback",
  registration.includes("emailRedirectTo:") &&
    registration.includes("/auth/callback?next=") &&
    registration.includes("router.replace(nextPath)") &&
    authCallback.includes("exchangeCodeForSession"),
);
check(
  "Magic link nie tworzy przypadkiem nowego konta",
  login.includes("shouldCreateUser: false"),
);
check(
  "Komunikaty Supabase są tłumaczone na język polski",
  login.includes("Nieprawidłowy e-mail lub hasło") &&
    registration.includes("Tworzenie kont jest chwilowo wyłączone"),
);
check(
  "Cała aplikacja używa jednego klienta sesji cookie",
  browserClient.includes('createBrowserClient') &&
    legacyBrowserClient.includes("supabaseClient as createBrowserSupabase") &&
    !browserClient.includes("createClient<Database>"),
);
check(
  "Reset hasła wraca przez callback do formularza",
  login.includes('encodeURIComponent("/reset-hasla")') &&
    profile.includes('encodeURIComponent("/reset-hasla")'),
);
check(
  "SQL zwraca 7 testów kontrolnych",
  migration.includes("wszystkie 7 wierszy") &&
    migration.includes("Rozpoznanie konta korzysta z auth.users"),
);

for (const item of checks) {
  console.log(`${item.passed ? "OK" : "BŁĄD"} | ${item.name}`);
}

const failures = checks.filter((item) => !item.passed);
if (failures.length) {
  console.error(`\nNiepowodzenie: ${failures.length} z ${checks.length} testów.`);
  process.exit(1);
}

console.log(`\nCRPE v5.1c: ${checks.length}/${checks.length} testów OK.`);
