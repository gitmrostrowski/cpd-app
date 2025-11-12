// app/api/activities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { Database } from "@/types/supabase";

const bodySchema = z.object({
  title: z.string().min(1),
  type: z.enum(["ride", "run", "walk"]),
  distance_m: z.number().int().nonnegative().optional(),
});

type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
    }

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: auth.user.id,
      title: parsed.data.title,
      type: parsed.data.type,
      distance_m: parsed.data.distance_m ?? null,
    })
    .select()
    .single<ActivityRow>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(Number.isFinite(limit) ? limit : 20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
