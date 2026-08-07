import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const audience = read("components/TrainingAudienceField.tsx");
const directory = read("app/baza-szkolen/TrainingHubClient.tsx");
const admin = read("app/admin/szkolenia/page.tsx");
const submission = read("app/api/trainings/submissions/route.ts");
const contact = read("app/api/contact/route.ts");
const contactModal = read("components/RoleContactModal.tsx");
const migration = read(
  "supabase/migrations/20260804_crpe_v6_2_2_contact_and_audience_repair.sql",
);

const checks = [
  [
    "Adresaci korzystają z katalogu zawodów i obsługują wiele grup",
    audience.includes("ProfessionOption") &&
      audience.includes("Wszyscy medycy") &&
      audience.includes("toggleProfession") &&
      directory.includes("options={professionOptions}") &&
      admin.includes("options={professionOptions}"),
  ],
  [
    "Nowe zgłoszenie wymaga adresatów po stronie klienta i serwera",
    directory.includes('alert("Wybierz adresatów szkolenia.")') &&
      directory.includes("profession: fProfession") &&
      submission.includes('profession: z.string().trim().min(2).max(500)'),
  ],
  [
    "Administrator nie zaakceptuje szkolenia bez adresatów i widzi właściwe pole",
    admin.includes("hasTrainingAudience(next.profession)") &&
      admin.includes("admin-training-audience") &&
      admin.includes("Przed akceptacją wybierz adresatów szkolenia"),
  ],
  [
    "Kafelek ma spokojniejszą hierarchię, czytelne logo i tematy w szczegółach",
      directory.includes("font-extrabold leading-[1.3]") &&
      directory.includes("detailsTraining.topics.map") &&
      directory.includes('? "h-8 w-[76px]"') &&
      directory.includes("Przejdź do zapisów") &&
      directory.includes("GraduationCap"),
  ],
  [
    "Awaria diagnostyki Supabase nie blokuje wysyłki kontaktu",
    contact.includes("database rate-limit unavailable; email delivery continues") &&
      contact.includes("database insert unavailable; email delivery continues") &&
      contact.includes("updateStoredRecord") &&
      !contact.includes('if (!supabaseUrl || !serviceRoleKey || !brevoKey || !fromEmail)'),
  ],
  [
    "Błąd formularza oferuje niezależne skopiowanie adresu",
    contactModal.includes("copyFallbackAddress") &&
      contactModal.includes("Kopiuj adres") &&
      contactModal.includes("fallbackCopied"),
  ],
  [
    "Migracja przywraca pełną diagnostykę i prawo edycji adresatów",
    migration.includes("grant select, insert, update") &&
      migration.includes("confirmation_status") &&
      migration.includes("target_profession_text") &&
      migration.includes("adresaci_update"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
