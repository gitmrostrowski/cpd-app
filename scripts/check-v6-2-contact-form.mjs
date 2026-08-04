import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const modal = read("components/RoleContactModal.tsx");
const directContacts = read("components/DirectEmailContacts.tsx");
const page = read("app/kontakt/page.tsx");
const api = read("app/api/contact/route.ts");
const migration = read("supabase/migrations/20260804_crpe_v6_2_contact_form.sql");
const home = read("app/page.tsx");

const checks = [
  [
    "Formularz wysyła dane do endpointu zamiast otwierać mailto",
    modal.includes('fetch("/api/contact"') &&
      !modal.includes("window.location.href") &&
      !modal.includes("Przygotuj wiadomość"),
  ],
  [
    "Formularz medyka nie pokazuje pól placówki ani skali",
    modal.includes('role !== "medyk"') &&
      modal.includes('role === "medyk" ? undefined : organisation') &&
      page.includes('role="medyk"'),
  ],
  [
    "Endpoint kieruje role na trzy właściwe skrzynki",
    api.includes('"pomoc@crpe.pl"') &&
      api.includes('"kontakt@crpe.pl"') &&
      api.includes('"zgloszenia@crpe.pl"'),
  ],
  [
    "Wiadomości są wysyłane serwerowo przez Brevo z Reply-To użytkownika",
    api.includes("https://api.brevo.com/v3/smtp/email") &&
      api.includes("BREVO_API_KEY") &&
      api.includes("replyTo") &&
      !modal.includes("BREVO_API_KEY"),
  ],
  [
    "Publiczny endpoint ma walidację, honeypot, kontrolę pochodzenia i limit",
    api.includes("contactSchema.safeParse") &&
      api.includes("validSameOrigin") &&
      api.includes("elapsed < 1_500") &&
      api.includes(">= 5") &&
      modal.includes("website"),
  ],
  [
    "Każde prawdziwe zgłoszenie ma zapis statusu i numer referencyjny",
    api.includes('.from("contact_messages")') &&
      api.includes('status: "pending"') &&
      api.includes('status: "sent"') &&
      api.includes('status: "failed"') &&
      modal.includes("Numer zgłoszenia"),
  ],
  [
    "Tabela zgłoszeń jest niedostępna bezpośrednio dla anon i authenticated",
    migration.includes("enable row level security") &&
      migration.includes("revoke all on table public.contact_messages from anon, authenticated") &&
      migration.includes("grant select, insert, update on table public.contact_messages to service_role"),
  ],
  [
    "Sekcja bezpośrednia eksponuje trzy adresy i ma kopiowanie",
    directContacts.includes("pomoc@crpe.pl") &&
      directContacts.includes("kontakt@crpe.pl") &&
      directContacts.includes("zgloszenia@crpe.pl") &&
      directContacts.includes("Kopiuj adres") &&
      page.includes("<DirectEmailContacts />"),
  ],
  [
    "Główna strona prowadzi do działającego formularza, nie do samego mailto",
    home.includes('href="/kontakt#formularz"') && !home.includes('href="mailto:kontakt@crpe.pl"'),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
