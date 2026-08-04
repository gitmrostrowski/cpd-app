import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const api = read("app/api/contact/route.ts");
const modal = read("components/RoleContactModal.tsx");
const migration = read("supabase/migrations/20260804_crpe_v6_2_1_contact_delivery.sql");

const checks = [
  [
    "Routing medyka, placówki i organizatora nie może być po cichu nadpisany",
    api.includes('recipient: "pomoc@crpe.pl"') &&
      api.includes('recipient: "kontakt@crpe.pl"') &&
      api.includes('recipient: "zgloszenia@crpe.pl"') &&
      !api.includes("CRPE_SUPPORT_EMAIL") &&
      !api.includes("CRPE_CONTACT_EMAIL"),
  ],
  [
    "Endpoint wysyła osobno wiadomość do CRPE i potwierdzenie do zgłaszającego",
    api.includes('"contact_recipient"') &&
      api.includes('"contact_confirmation"') &&
      api.includes("confirmationMessageId") &&
      api.includes("confirmation_sent: true"),
  ],
  [
    "Statusy i identyfikatory obu wiadomości są zapisywane oddzielnie",
    api.includes('recipient_status: "accepted"') &&
      api.includes("recipient_provider_message_id") &&
      api.includes('confirmation_status: "accepted"') &&
      api.includes("confirmation_provider_message_id"),
  ],
  [
    "Częściowy sukces nie jest przedstawiany jako pełna wysyłka",
    api.includes('status: "partial"') &&
      api.includes("confirmation_sent: false") &&
      modal.includes("Nie udało się wysłać kopii"),
  ],
  [
    "Nieprawidłowy czas formularza nie zwraca fałszywego sukcesu",
    /if \(elapsed < 1_500 \|\| elapsed >[\s\S]*?\{\s*return json\(\{ error: "invalid_request" \}, 400\);\s*\}/.test(api),
  ],
  [
    "Migracja rozszerza status i dodaje pola diagnostyczne",
    migration.includes("'partial'") &&
      migration.includes("recipient_status") &&
      migration.includes("confirmation_status") &&
      migration.includes("confirmation_provider_message_id"),
  ],
  [
    "Migracja pozostawia pełne uprawnienia backendowi i zawiera kontrolę",
    migration.includes("grant select, insert, update") &&
      migration.includes("has_column_privilege") &&
      migration.includes("brevo_przyjelo_do_crpe"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
