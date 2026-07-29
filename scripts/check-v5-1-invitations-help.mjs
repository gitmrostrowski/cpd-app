import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const migration = read(
  "supabase/migrations/20260729_crpe_v5_1_invitations_and_help_FIX2.sql",
);
const api = read("app/api/organizations/invitations/route.ts");
const panel = read(
  "app/placowka/[organizationId]/OrganizationPanelClient.tsx",
);
const invitation = read("app/placowka/zaproszenie/page.tsx");
const help = read("app/pomoc/page.tsx");

const checks = [];
function check(name, passed) {
  checks.push({ name, passed });
}

check(
  "Migracja dodaje pełny stan zaproszenia",
  [
    "delivery_status",
    "send_attempts",
    "last_sent_at",
    "last_send_error",
    "opened_at",
    "authenticated_at",
  ].every((value) => migration.includes(value)),
);
check(
  "Baza obsługuje ponowienie i anulowanie",
  migration.includes("prepare_organization_invitation_resend") &&
    migration.includes("cancel_organization_invitation"),
);
check(
  "Otwarcie i logowanie są zapisywane osobno",
  migration.includes("mark_organization_invitation_opened") &&
    migration.includes("mark_organization_invitation_authenticated"),
);
check(
  "Dostęp do zaproszeń jest kontrolowany uprawnieniem",
  migration.includes("'invitations.manage'") &&
    migration.includes("'invitations.view'") &&
    migration.includes("security definer"),
);
check(
  "API wysyła wiadomość przez Brevo poza przeglądarką",
  api.includes("https://api.brevo.com/v3/smtp/email") &&
    api.includes("BREVO_API_KEY") &&
    api.includes('"api-key": apiKey') &&
    !api.includes("NEXT_PUBLIC_BREVO"),
);
check(
  "Panel przekazuje sesję do serwerowej wysyłki",
  panel.includes("supabase.auth.getSession()") &&
    panel.includes("Authorization: `Bearer ${session.access_token}`") &&
    panel.includes('invitationRequest("POST"') &&
    panel.includes('invitationRequest("DELETE"'),
);
check(
  "API weryfikuje przekazany token sesji",
  api.includes('request.headers.get("authorization")') &&
    api.includes("Authorization: authorization") &&
    api.includes("supabaseServer(request)") &&
    api.includes("authError || !authData.user"),
);
check(
  "Wysyłka używa klucza idempotencji",
  api.includes('"Idempotency-Key"') &&
    api.includes('"X-Crpe-Invitation-Id"'),
);
check(
  "Formularz przyjmuje wiele adresów",
  panel.includes("Wpisz jeden adres albo wklej listę") &&
    panel.includes("split(/[\\s,;]+/)"),
);
check(
  "Panel pokazuje pełny rejestr zaproszeń",
  [
    "Rejestr zaproszeń",
    "Błąd wysyłki",
    "Link otwarty",
    "Zalogowano się",
    "Powiązana z placówką",
    "Ponów",
    "Anuluj",
  ].every((value) => panel.includes(value)),
);
check(
  "Strona zaproszenia zapisuje wejście i logowanie",
  invitation.includes("mark_organization_invitation_opened") &&
    invitation.includes("mark_organization_invitation_authenticated"),
);
check(
  "Pomoc prowadzi nowego użytkownika przez szybki start",
  help.includes("Pierwszy raz w CRPE?") &&
    help.includes("Zacznij od tych czterech kroków"),
);
check(
  "Pomoc obejmuje siedem obszarów",
  [
    "Konto i logowanie",
    "Panel CPD",
    "Aktywności",
    "Dokumenty",
    "Raporty",
    "Baza szkoleń",
    "Panel placówki",
  ].every((value) => help.includes(value)),
);
check(
  "Każda instrukcja ma kroki, rezultat i przejście",
  help.includes("item.steps.map") &&
    help.includes("<strong>Rezultat:</strong>") &&
    help.includes("item.action"),
);
check(
  "Pomoc nie sugeruje formalnego rozliczenia",
  help.includes("nie jest formalnym potwierdzeniem") &&
    help.includes("Nie zastępuje oficjalnego rejestru"),
);
check(
  "SQL zwraca 10 testów kontrolnych",
  migration.includes("wszystkie 10 wierszy") &&
    migration.includes("Brak wysłanych zaproszeń bez próby wysyłki"),
);

for (const item of checks) {
  console.log(`${item.passed ? "OK" : "BŁĄD"} | ${item.name}`);
}

const failures = checks.filter((item) => !item.passed);
if (failures.length) {
  console.error(`\nNiepowodzenie: ${failures.length} z ${checks.length} testów.`);
  process.exit(1);
}

console.log(`\nCRPE v5.1a: ${checks.length}/${checks.length} testów OK.`);
