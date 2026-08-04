import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  createTrainingLogoAdminClient,
  removeTrainingLogo,
  TrainingLogoError,
  uploadTrainingLogo,
} from "@/lib/server/trainingOrganizerLogo";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}

async function requireAdmin() {
  const supabase = await supabaseServer();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return null;

  const { data: role, error: roleError } = await supabase
    .from("platform_staff_roles")
    .select("role_code")
    .eq("user_id", auth.user.id)
    .eq("role_code", "platform_admin")
    .is("revoked_at", null)
    .maybeSingle();

  if (roleError || !role) return null;
  return auth.user;
}

function logoErrorResponse(error: unknown) {
  if (error instanceof TrainingLogoError) {
    const status = [
      "logo_configuration_missing",
      "logo_upload_failed",
    ].includes(error.code)
      ? 500
      : 400;
    return NextResponse.json({ error: error.code }, { status });
  }
  console.error("Admin training logo operation failed", error);
  return NextResponse.json({ error: "logo_operation_failed" }, { status: 500 });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 3 * 1024 * 1024) {
    return NextResponse.json({ error: "invalid_logo_size" }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const trainingId = formData.get("training_id");
    const file = formData.get("organizer_logo");
    if (
      typeof trainingId !== "string" ||
      !UUID_PATTERN.test(trainingId) ||
      !(file instanceof File) ||
      file.size === 0
    ) {
      return NextResponse.json({ error: "invalid_logo_request" }, { status: 400 });
    }

    const service = createTrainingLogoAdminClient();
    const { data: existing, error: findError } = await service
      .from("trainings")
      .select("id,organizer_logo_path")
      .eq("id", trainingId)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) {
      return NextResponse.json({ error: "training_not_found" }, { status: 404 });
    }

    const uploaded = await uploadTrainingLogo(file, admin.id);
    const { error: updateError } = await service
      .from("trainings")
      .update({
        organizer_logo_url: uploaded.url,
        organizer_logo_path: uploaded.path,
      })
      .eq("id", trainingId);
    if (updateError) {
      await removeTrainingLogo(uploaded.path);
      throw updateError;
    }

    await removeTrainingLogo(existing.organizer_logo_path);
    return NextResponse.json({
      organizer_logo_url: uploaded.url,
      organizer_logo_path: uploaded.path,
    });
  } catch (error) {
    return logoErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const body = (await request.json()) as { training_id?: unknown };
    const trainingId = body.training_id;
    if (typeof trainingId !== "string" || !UUID_PATTERN.test(trainingId)) {
      return NextResponse.json({ error: "invalid_logo_request" }, { status: 400 });
    }

    const service = createTrainingLogoAdminClient();
    const { data: existing, error: findError } = await service
      .from("trainings")
      .select("id,organizer_logo_path")
      .eq("id", trainingId)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) {
      return NextResponse.json({ error: "training_not_found" }, { status: 404 });
    }

    const { error: updateError } = await service
      .from("trainings")
      .update({ organizer_logo_url: null, organizer_logo_path: null })
      .eq("id", trainingId);
    if (updateError) throw updateError;

    await removeTrainingLogo(existing.organizer_logo_path);
    return NextResponse.json({ organizer_logo_url: null, organizer_logo_path: null });
  } catch (error) {
    return logoErrorResponse(error);
  }
}
