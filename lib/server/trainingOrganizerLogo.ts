import "server-only";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

export const TRAINING_LOGO_BUCKET = "training-organizer-logos";
export const TRAINING_LOGO_MAX_INPUT_BYTES = 2 * 1024 * 1024;
export const TRAINING_LOGO_MAX_INPUT_PIXELS = 16_000_000;
export const TRAINING_LOGO_MAX_DIMENSION = 256;

const ALLOWED_DECLARED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_DETECTED_FORMATS = new Set(["jpeg", "png", "webp"]);

export class TrainingLogoError extends Error {
  constructor(
    public readonly code:
      | "invalid_logo_type"
      | "invalid_logo_size"
      | "invalid_logo_dimensions"
      | "invalid_logo_image"
      | "logo_configuration_missing"
      | "logo_upload_failed",
  ) {
    super(code);
    this.name = "TrainingLogoError";
  }
}

export function createTrainingLogoAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new TrainingLogoError("logo_configuration_missing");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function prepareTrainingLogo(file: File) {
  if (
    file.size <= 0 ||
    file.size > TRAINING_LOGO_MAX_INPUT_BYTES
  ) {
    throw new TrainingLogoError("invalid_logo_size");
  }

  if (!ALLOWED_DECLARED_TYPES.has(file.type)) {
    throw new TrainingLogoError("invalid_logo_type");
  }

  const input = Buffer.from(await file.arrayBuffer());

  try {
    const image = sharp(input, {
      failOn: "error",
      limitInputPixels: TRAINING_LOGO_MAX_INPUT_PIXELS,
    });
    const metadata = await image.metadata();

    if (!metadata.format || !ALLOWED_DETECTED_FORMATS.has(metadata.format)) {
      throw new TrainingLogoError("invalid_logo_type");
    }

    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > TRAINING_LOGO_MAX_INPUT_PIXELS ||
      (metadata.pages ?? 1) > 1
    ) {
      throw new TrainingLogoError("invalid_logo_dimensions");
    }

    return await image
      .rotate()
      .resize(TRAINING_LOGO_MAX_DIMENSION, TRAINING_LOGO_MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 86, alphaQuality: 90, effort: 4 })
      .toBuffer();
  } catch (error) {
    if (error instanceof TrainingLogoError) throw error;
    throw new TrainingLogoError("invalid_logo_image");
  }
}

export async function uploadTrainingLogo(file: File, ownerId: string) {
  const output = await prepareTrainingLogo(file);
  const storage = createTrainingLogoAdminClient().storage;
  const path = `${ownerId}/${crypto.randomUUID()}.webp`;
  const { error } = await storage.from(TRAINING_LOGO_BUCKET).upload(path, output, {
    cacheControl: "31536000",
    contentType: "image/webp",
    upsert: false,
  });

  if (error) {
    console.error("Training organizer logo upload failed", error);
    throw new TrainingLogoError("logo_upload_failed");
  }

  const { data } = storage.from(TRAINING_LOGO_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function removeTrainingLogo(path: string | null | undefined) {
  if (!path) return;
  const { error } = await createTrainingLogoAdminClient()
    .storage
    .from(TRAINING_LOGO_BUCKET)
    .remove([path]);
  if (error) console.error("Training organizer logo cleanup failed", error);
}
