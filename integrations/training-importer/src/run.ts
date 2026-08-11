import { appendFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { fetchWithRetry } from "./http.js";
import { nilAdapter } from "./sources/nil.js";
import type { ImportApiResult, SourceAdapter, TrainingImportPayload } from "./types.js";

const adapters: Record<string, SourceAdapter> = { nil: nilAdapter };

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Brak wymaganej zmiennej ${name}.`);
  return value;
}

async function loginImporter() {
  const supabase = createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase.auth.signInWithPassword({
    email: requiredEnv("NIL_IMPORT_EMAIL"),
    password: requiredEnv("NIL_IMPORT_PASSWORD"),
  });
  if (error || !data.session) {
    throw new Error(`Logowanie importera nie powiodło się: ${error?.message ?? "brak sesji"}`);
  }
  return data.session.access_token;
}

async function submit(
  endpoint: string,
  payload: TrainingImportPayload,
  token: string,
  serverDryRun: boolean,
) {
  const url = serverDryRun ? `${endpoint}?dry_run=true` : endpoint;
  const response = await fetchWithRetry(
    url,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
    { attempts: 3, timeoutMs: 25_000 },
  );
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${body.slice(0, 500)}`);
  }
  return JSON.parse(body) as ImportApiResult;
}

async function writeGithubSummary(lines: string[]) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  await appendFile(path, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const sourceCode = process.argv[2]?.trim().toLowerCase() || "nil";
  const adapter = adapters[sourceCode];
  if (!adapter) throw new Error(`Nieznane źródło: ${sourceCode}`);

  const localDryRun = process.env.DRY_RUN !== "false";
  const serverDryRun = process.env.SERVER_DRY_RUN === "true";
  const includeFullDescriptions = process.env.NIL_IMPORT_FULL_DESCRIPTIONS === "true";
  const userAgent =
    process.env.IMPORTER_USER_AGENT?.trim() ||
    "CRPE-TrainingImporter/1.1 (+https://www.crpe.pl/kontakt)";
  const response = await fetchWithRetry(
    adapter.feedUrl,
    { headers: { accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8", "user-agent": userAgent } },
    { attempts: 3, timeoutMs: 20_000 },
  );
  if (!response.ok) throw new Error(`Źródło ${sourceCode} zwróciło HTTP ${response.status}.`);
  const xml = await response.text();
  if (xml.trim().length < 100) throw new Error(`Źródło ${sourceCode} zwróciło pustą odpowiedź.`);

  const parsed = adapter.parse(xml, { includeFullDescriptions });
  console.log(
    `Źródło ${sourceCode}: ${parsed.sourceItemCount} pozycji, ${parsed.payloads.length} gotowych, ${parsed.skipped.length} pominiętych.`,
  );
  for (const item of parsed.skipped) {
    console.log(`POMINIĘTO: ${item.title} — ${item.reason}`);
  }

  if (localDryRun) {
    console.log("TRYB LOCAL DRY-RUN — nic nie zostanie wysłane do CRPE.");
    for (const payload of parsed.payloads) {
      console.log(JSON.stringify(payload, null, 2));
    }
    await writeGithubSummary([
      `## Import ${sourceCode} — local dry-run`,
      `- Pozycje źródłowe: ${parsed.sourceItemCount}`,
      `- Gotowe do wysłania: ${parsed.payloads.length}`,
      `- Pominięte: ${parsed.skipped.length}`,
    ]);
    return;
  }

  const defaultEndpoint = `https://www.crpe.pl/api/integrations/${sourceCode}/trainings`;
  const endpoint = process.env.INTEGRATION_ENDPOINT_OVERRIDE?.trim() || defaultEndpoint;
  const token = await loginImporter();
  const counts = new Map<string, number>();
  const failures: Array<{ title: string; error: string }> = [];

  for (const payload of parsed.payloads) {
    try {
      const result = await submit(endpoint, payload, token, serverDryRun);
      counts.set(result.status, (counts.get(result.status) ?? 0) + 1);
      console.log(`${result.status}: ${payload.title} [${payload.source_external_id}]`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "nieznany błąd";
      failures.push({ title: payload.title, error: message });
      console.error(`BŁĄD: ${payload.title} — ${message}`);
    }
  }

  const countLines = Array.from(counts.entries()).map(
    ([status, count]) => `- ${status}: ${count}`,
  );
  await writeGithubSummary([
    `## Import ${sourceCode}${serverDryRun ? " — server dry-run" : ""}`,
    ...countLines,
    `- Pominięte przez adapter: ${parsed.skipped.length}`,
    `- Błędy API: ${failures.length}`,
  ]);

  console.log(`Podsumowanie: ${JSON.stringify(Object.fromEntries(counts))}; błędy=${failures.length}`);
  if (failures.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
