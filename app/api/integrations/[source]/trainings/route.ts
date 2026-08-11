import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  trainingImportPayloadHash,
  trainingImportSchema,
} from "@/lib/integrations/trainingImport";
import type { Database } from "@/types/supabase";
import {
  PayloadTooLargeError,
  readJsonWithLimit,
} from "@/lib/http/readJsonWithLimit";

export const runtime = "nodejs";

const SOURCE_CODE_PATTERN = /^[a-z0-9][a-z0-9_-]{1,49}$/;
const MAX_BODY_BYTES = 128 * 1024;

function apiClient(authorization: string) {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) throw new Error("missing_supabase_configuration");

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers: { Authorization: authorization } },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ source: string }> },
) {
  const { source: rawSource } = await context.params;
  const source = rawSource.trim().toLowerCase();
  if (!SOURCE_CODE_PATTERN.test(source)) {
    return NextResponse.json({ error: "invalid_source" }, { status: 404 });
  }

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await readJsonWithLimit(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
    }
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = trainingImportSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_training",
        fields: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const supabase = apiClient(authorization);
    const accessToken = authorization.slice("Bearer ".length).trim();
    const { data: auth, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !auth.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const dryRun = new URL(request.url).searchParams.get("dry_run") === "true";
    const { data, error } = await supabase.rpc("import_training_from_source", {
      p_source_code: source,
      p_payload: parsed.data,
      p_payload_hash: trainingImportPayloadHash(parsed.data),
      p_dry_run: dryRun,
    });

    if (error) {
      const message = error.message.toLocaleLowerCase("pl-PL");
      if (
        message.includes("brak uprawnien importera") ||
        message.includes("zrodlo importu jest wylaczone") ||
        message.includes("nieznane zrodlo importu")
      ) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      if (
        message.includes("nieprawidlow") ||
        message.includes("nie istnieje lub jest nieaktywny")
      ) {
        return NextResponse.json({ error: "invalid_training" }, { status: 400 });
      }
      console.error("Training import RPC failed", {
        source,
        externalId: parsed.data.source_external_id,
        code: error.code,
      });
      return NextResponse.json({ error: "import_failed" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Training import endpoint failed", error);
    return NextResponse.json({ error: "import_failed" }, { status: 500 });
  }
}
