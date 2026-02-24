// app/api/admin/trainings/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

function supabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // route handlers: można ustawiać cookies, ale Next robi to specyficznie
          // @supabase/ssr to obsługuje; nic więcej nie trzeba
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

async function requireAdmin(supabase: ReturnType<typeof supabaseServer>) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) return { ok: false as const, status: 401 as const, userId: null };

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id) // <- u Ciebie profiles.user_id
    .maybeSingle();

  if (profErr) return { ok: false as const, status: 500 as const, userId: null };
  if (!profile || profile.role !== "admin") return { ok: false as const, status: 403 as const, userId: null };

  return { ok: true as const, status: 200 as const, userId: user.id as string };
}

// GET /api/admin/trainings?status=pending|approved|rejected|all&q=...
export async function GET(req: Request) {
  const supabase = supabaseServer();

  const admin = await requireAdmin(supabase);
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: admin.status });

  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "pending").toLowerCase();
  const q = (url.searchParams.get("q") || "").trim();

  let query = supabase
    .from("trainings")
    .select("*")
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`title.ilike.%${q}%,organizer.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ trainings: data ?? [] });
}

// PATCH /api/admin/trainings  body: { id, ...fields }
export async function PATCH(req: Request) {
  const supabase = supabaseServer();

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

  // Jeżeli masz te kolumny w trainings, ustawiamy ślady decyzji:
  if (patch.status === "approved") {
    patch.reviewed_by = admin.userId;
    patch.reviewed_at = new Date().toISOString();
    patch.reject_reason = null;
  }
  if (patch.status === "rejected") {
    patch.reviewed_by = admin.userId;
    patch.reviewed_at = new Date().toISOString();
    if (!("reject_reason" in patch)) patch.reject_reason = "Odrzucone";
  }
  if (patch.status === "pending") {
    patch.reviewed_by = null;
    patch.reviewed_at = null;
    patch.reject_reason = null;
  }

  const { data, error } = await supabase
    .from("trainings")
    .update(patch)
    .eq("id", body.id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ training: data });
}
