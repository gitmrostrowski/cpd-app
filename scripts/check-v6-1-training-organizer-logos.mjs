import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const migration = read(
  "supabase/migrations/20260804_crpe_v6_1_training_organizer_logos.sql",
);
const storage = read("lib/server/trainingOrganizerLogo.ts");
const submission = read("app/api/trainings/submissions/route.ts");
const adminApi = read("app/api/admin/trainings/logo/route.ts");
const directory = read("app/baza-szkolen/TrainingHubClient.tsx");
const admin = read("app/admin/szkolenia/page.tsx");
const data = read("lib/data/crpe.ts");
const gitignore = read(".gitignore");
const packageJson = JSON.parse(read("package.json"));

const publicFetch =
  data.match(
    /export async function fetchPublicTrainings[\s\S]*?export function toNormalizedTraining/,
  )?.[0] ?? "";

const checks = [
  [
    "Migracja tworzy kolumnę ścieżki i publiczny bucket WebP 2 MB",
    migration.includes("organizer_logo_path") &&
      migration.includes("training-organizer-logos") &&
      migration.includes("2097152") &&
      migration.includes("array['image/webp']::text[]"),
  ],
  [
    "Wewnętrzna ścieżka logo nie trafia do publicznego zapytania",
    publicFetch.includes("organizer_logo_url") &&
      !publicFetch.includes("organizer_logo_path"),
  ],
  [
    "Serwer przyjmuje tylko PNG/JPG/WebP i konwertuje do WebP 256 px",
    storage.includes('"image/png"') &&
      storage.includes('"image/jpeg"') &&
      storage.includes('"image/webp"') &&
      storage.includes("TRAINING_LOGO_MAX_DIMENSION = 256") &&
      storage.includes(".webp({"),
  ],
  [
    "Klucz service role pozostaje wyłącznie w module serwerowym",
    storage.includes('import "server-only"') &&
      storage.includes("SUPABASE_SERVICE_ROLE_KEY") &&
      !directory.includes("SUPABASE_SERVICE_ROLE_KEY"),
  ],
  [
    "Zgłoszenie używa FormData, uwierzytelnienia i sprzątania po błędzie",
    submission.includes("request.formData()") &&
      submission.includes("supabase.auth.getUser()") &&
      submission.includes("uploadTrainingLogo") &&
      submission.includes("removeTrainingLogo(uploadedLogo?.path)"),
  ],
  [
    "Kafelek pokazuje opcjonalne logo przy organizatorze bez pustej ramki",
    directory.includes("card\n") &&
      directory.includes("if (!logoUrl) return null") &&
      directory.includes("Logo organizatora (opcjonalnie)"),
  ],
  [
    "Administrator może zamienić lub usunąć logo",
    adminApi.includes("export async function POST") &&
      adminApi.includes("export async function DELETE") &&
      admin.includes("Usuń logo") &&
      admin.includes("/api/admin/trainings/logo"),
  ],
  [
    "NIL pozostaje prawidłową nazwą organizatora",
    !admin.includes('if (t.toLowerCase() === "nil") return null'),
  ],
  [
    "Sharp jest jawną zależnością produkcyjną",
    Boolean(packageJson.dependencies?.sharp),
  ],
  [
    "Migracje Supabase nie są ignorowane przez Git",
    !gitignore.split(/\r?\n/).some((line) => line.trim() === "supabase/"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
