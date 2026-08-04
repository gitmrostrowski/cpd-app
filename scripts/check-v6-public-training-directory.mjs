import fs from "node:fs";

const migrationPath =
  "supabase/migrations/20260804_crpe_v6_public_training_directory.sql";
const dataPath = "lib/data/crpe.ts";
const directoryPath = "app/baza-szkolen/TrainingHubClient.tsx";
const headerPath = "components/Header.tsx";
const submissionsApiPath = "app/api/trainings/submissions/route.ts";

const migration = fs.readFileSync(migrationPath, "utf8");
const data = fs.readFileSync(dataPath, "utf8");
const directory = fs.readFileSync(directoryPath, "utf8");
const header = fs.readFileSync(headerPath, "utf8");
const submissionsApi = fs.readFileSync(submissionsApiPath, "utf8");

const checks = [
  [
    "Anon ma wyłącznie kolumnowy dostęp do zatwierdzonych szkoleń",
    migration.includes("revoke all privileges on table public.trainings from anon") &&
      migration.includes("grant select (") &&
      migration.includes("to anon") &&
      migration.includes("using (approval_status = 'approved')"),
  ],
  [
    "Dane zgłaszającego nie są pobierane publicznie",
    data.includes("fetchPublicTrainings") &&
      !data
        .match(/export async function fetchPublicTrainings[\s\S]*?export function toNormalizedTraining/)?.[0]
        .includes("submitted_email"),
  ],
  [
    "Publiczna strona nie czeka na sesję",
    directory.includes("fetchPublicTrainings") &&
      !directory.includes("Sprawdzam sesję"),
  ],
  [
    "Logo organizatora jest obsługiwane w danych i interfejsie",
    migration.includes("organizer_logo_url") &&
      data.includes("organizer_logo_url") &&
      directory.includes("OrganizerLogo"),
  ],
  [
    "Baza szkoleń jest widoczna w publicznym menu",
    header.includes('{ href: "/baza-szkolen", label: "Baza szkoleń" }'),
  ],
  [
    "Zgłoszenia przechodzą przez uwierzytelniony endpoint i Brevo",
    submissionsApi.includes("supabase.auth.getUser()") &&
      submissionsApi.includes("CRPE_TRAINING_SUBMISSIONS_EMAIL") &&
      submissionsApi.includes("https://api.brevo.com/v3/smtp/email"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
