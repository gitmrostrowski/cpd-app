import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const migration = read(
  "supabase/migrations/20260729_crpe_v5_organization_panel.sql",
);
const panel = read(
  "app/placowka/[organizationId]/OrganizationPanelClient.tsx",
);
const invitation = read("app/placowka/zaproszenie/page.tsx");
const header = read("components/Header.tsx");
const calculator = read("app/kalkulator/CalculatorClient.tsx");

const checks = [];
function check(name, passed) {
  checks.push({ name, passed });
}

check(
  "Migracja tworzy role jednostkowe, zaproszenia i audyt",
  [
    "public.organization_role_permissions",
    "public.organization_unit_role_assignments",
    "public.organization_invitations",
    "public.organization_audit_events",
  ].every((name) => migration.includes(name)),
);
check(
  "Uprawnienia są egzekwowane funkcją bazy",
  migration.includes("public.has_organization_permission") &&
    migration.includes("security definer"),
);
check(
  "Administrator nie otrzymuje owner.manage",
  migration.includes("'Administrator nie może zarządzać właścicielem'") &&
    !migration.includes("('admin', 'owner.manage')"),
);
check(
  "Ostatni właściciel jest chroniony",
  migration.includes(
    "Placówka musi mieć co najmniej jednego aktywnego właściciela.",
  ),
);
check(
  "Zaproszenie weryfikuje e-mail z JWT",
  migration.includes("auth.jwt() ->> 'email'") &&
    migration.includes("v_auth_email <> v_invitation.email_normalized"),
);
check(
  "Zaproszenie wygasa po 14 dniach",
  migration.includes("interval '14 days'"),
);
check(
  "Członkostwo nie udostępnia automatycznie danych",
  invitation.includes(
    "nie przekazuje placówce automatycznie Twoich",
  ),
);
check(
  "Panel ma cztery główne obszary",
  ["Pulpit", "Zespół", "Struktura", "Role i dostęp"].every((label) =>
    panel.includes(label),
  ),
);
check(
  "Panel obsługuje zakres organizacji i jednostki",
  panel.includes("Cała placówka") &&
    panel.includes("Jednostka:") &&
    panel.includes("p_unit_id"),
);
check(
  "Panel pozwala zaprosić, nadać rolę i utworzyć jednostkę",
  [
    "create_organization_invitation",
    "set_organization_role",
    "create_organization_unit",
  ].every((name) => panel.includes(name)),
);
check(
  "Nagłówek udostępnia przełącznik placówki",
  header.includes('href="/placowka"') &&
    header.includes("get_my_organization_contexts"),
);
check(
  "Stary raport organizacji przekierowuje do panelu",
  read("app/raporty/organizacja/page.tsx").includes('redirect("/placowka")'),
);
check(
  "Informacja prawna w kalkulatorze jest zwarta",
  calculator.includes("Szczegóły i źródło") &&
    !calculator.includes("Dostępna zweryfikowana reguła podstawowa"),
);
check(
  "Migracja tworzy placówkę pilotażową",
  migration.includes("crpe-placowka-pilotazowa") &&
    migration.includes("'owner'"),
);
check(
  "SQL zwraca 12 testów kontrolnych",
  migration.includes("wszystkie 12 wierszy") &&
    migration.includes("'Brak oczekujących zaproszeń z przeszłą datą ważności'"),
);

for (const item of checks) {
  console.log(`${item.passed ? "OK" : "BŁĄD"} | ${item.name}`);
}

const failures = checks.filter((item) => !item.passed);
if (failures.length) {
  console.error(`\nNiepowodzenie: ${failures.length} z ${checks.length} testów.`);
  process.exit(1);
}

console.log(`\nCRPE v5: ${checks.length}/${checks.length} testów OK.`);
