// app/api/admin/trainings/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { fetchTrainings, toNormalizedTraining } from "@/lib/data/crpe";

type TrainingStatus = "pending" | "approved" | "rejected";

type TrainingPatch = {
  id: string;
  title?: string;
  organizer?: string | null;
  points?: number | null;
  start_date?: string | null; // YYYY-MM-DD
  end_date?: string | null;   // YYYY-MM-DD
  url?: string | null;
  description?: string | null;
  status?: TrainingStatus;
  reject_reason?: string | null;
};

async function supabaseServer() {
  // ✅ Next.js 15/16: cookies() jest async
  const cookieStore = (await cookies()) as any;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // W route handlerach cookieStore bywa typowany jako readonly,
          // ale w praktyce set działa. Rzucamy na any, żeby TS nie blokował buildu.
          cookiesToSet.forEach(({ name, value, options }: any) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof supabaseServer>>) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) return { ok: false as const, status: 401 as const, userId: null };

  const { data: profile, error: profErr } = await supabase
    .from("platform_staff_roles")
    .select("role_code")
    .eq("user_id", user.id)
    .eq("role_code", "platform_admin")
    .is("revoked_at", null)
    .maybeSingle();

  if (profErr) return { ok: false as const, status: 500 as const, userId: null };
  if (!profile) return { ok: false as const, status: 403 as const, userId: null };

  return { ok: true as const, status: 200 as const, userId: user.id as string };
}

// GET /api/admin/trainings?status=pending|approved|rejected|all&q=...
export async function GET(req: Request) {
  const supabase = await supabaseServer();

  const admin = await requireAdmin(supabase);
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: admin.status });

  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "pending").toLowerCase();
  const q = (url.searchParams.get("q") || "").trim();

  try {
    let data = await fetchTrainings(supabase);
    if (status !== "all")
      data = data.filter((row) => row.approval_status === status);
    if (q) {
      const phrase = q.toLocaleLowerCase("pl-PL");
      data = data.filter((row) =>
        [row.title, row.organizer].some((value) =>
          String(value ?? "").toLocaleLowerCase("pl-PL").includes(phrase),
        ),
      );
    }
    data.sort((a, b) =>
      String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")),
    );
    return NextResponse.json({ trainings: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Database error" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/trainings  body: { id, ...fields }
export async function PATCH(req: Request) {
  const supabase = await supabaseServer();

  const admin = await requireAdmin(supabase);
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: admin.status });

  let body: TrainingPatch | null = null;
  try {
    body = (await req.json()) as TrainingPatch;
  } catch {
    body = null;
  }

  if (!body?.id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const patch: any = { ...body };
  delete patch.id;
  const existing = (await fetchTrainings(supabase)).find(
    (training) => training.id === body.id,
  );
  if (!existing)
    return NextResponse.json(
      { error: "training not found" },
      { status: 404 },
    );
  const normalized: Record<string, any> = toNormalizedTraining({
    ...existing,
    ...patch,
    title: patch.title ?? existing.title,
    approval_status: patch.status ?? existing.approval_status,
  });

  // Ślady akceptacji/odrzucenia (jeśli masz te kolumny w trainings)
  if (patch.status === "approved") {
    normalized.approved_by = admin.userId;
    normalized.approved_at = new Date().toISOString();
    normalized.reject_reason = null;
  }
  if (patch.status === "rejected") {
    normalized.approved_by = admin.userId;
    normalized.approved_at = new Date().toISOString();
    if (!("reject_reason" in patch)) normalized.reject_reason = "Odrzucone";
  }
  if (patch.status === "pending") {
    normalized.approved_by = null;
    normalized.approved_at = null;
    normalized.reject_reason = null;
  }

  const { data, error } = await supabase
    .from("trainings")
    .update(normalized)
    .eq("id", body.id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ training: data });
}
