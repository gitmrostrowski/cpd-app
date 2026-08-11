import { createHash } from "node:crypto";
import { z } from "zod";

const nullableDate = z.iso.date().nullable();
const nullableTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .nullable();

export const trainingImportSchema = z
  .object({
    source_external_id: z.string().trim().min(1).max(200),
    source_url: z.url().max(2000),
    source_fetched_at: z.iso.datetime({ offset: true }),
    title: z.string().trim().min(3).max(240),
    organizer: z.string().trim().min(2).max(180),
    points: z.number().min(0).max(10000).nullable(),
    delivery_format: z.enum(["online", "in_person", "hybrid"]),
    category: z.enum([
      "kurs",
      "konferencja",
      "warsztaty",
      "publikacja",
      "szkolenie",
      "inne",
    ]),
    schedule_status: z.enum(["scheduled", "to_be_determined"]),
    start_date: nullableDate,
    end_date: nullableDate,
    start_time: nullableTime,
    end_time: nullableTime,
    time_zone: z.string().trim().min(1).max(100).default("Europe/Warsaw"),
    speakers: z.array(z.string().trim().min(2).max(180)).max(20),
    voivodeship: z.string().trim().min(2).max(160).nullable(),
    external_url: z.url().max(2000),
    topics: z.array(z.string().trim().min(1).max(80)).max(20),
    price_pln: z.number().min(0).max(1000000).nullable(),
    has_recording: z.boolean().nullable(),
    capacity: z.number().int().min(0).max(1000000).nullable(),
    enrollment_status: z.enum(["open", "waiting_list", "closed"]).nullable(),
    description: z.string().trim().max(5000).nullable(),
    source_warnings: z.array(z.string().trim().min(2).max(240)).max(20),
    audience_scope: z.literal("specific"),
    profession_codes: z
      .array(z.string().trim().min(1).max(80))
      .min(1)
      .max(20),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.profession_codes).size !== value.profession_codes.length) {
      ctx.addIssue({
        code: "custom",
        path: ["profession_codes"],
        message: "duplicate_profession_codes",
      });
    }
    if (value.schedule_status === "scheduled" && !value.start_date) {
      ctx.addIssue({
        code: "custom",
        path: ["start_date"],
        message: "start_date_required",
      });
    }
    if (
      value.schedule_status === "to_be_determined" &&
      (value.start_date || value.end_date || value.start_time || value.end_time)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["schedule_status"],
        message: "undated_training_cannot_have_schedule",
      });
    }
    if (value.start_date && value.end_date && value.end_date < value.start_date) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "invalid_date_range",
      });
    }
    if (value.end_time && !value.start_time) {
      ctx.addIssue({
        code: "custom",
        path: ["end_time"],
        message: "start_time_required",
      });
    }
    if (
      value.start_time &&
      value.end_time &&
      (!value.end_date || value.end_date === value.start_date) &&
      value.end_time <= value.start_time
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["end_time"],
        message: "invalid_time_range",
      });
    }
    try {
      new Intl.DateTimeFormat("pl-PL", { timeZone: value.time_zone }).format();
    } catch {
      ctx.addIssue({
        code: "custom",
        path: ["time_zone"],
        message: "invalid_time_zone",
      });
    }
  });

export type TrainingImportPayload = z.infer<typeof trainingImportSchema>;

/**
 * source_fetched_at opisuje wykonanie scrapera, a nie treść szkolenia.
 * Pomijamy je w skrócie, aby kolejne pobranie identycznego wpisu zwracało
 * `unchanged`, zamiast niepotrzebnie cofać zaakceptowane szkolenie do moderacji.
 */
export function trainingImportPayloadHash(payload: TrainingImportPayload) {
  const {
    source_fetched_at: _sourceFetchedAt,
    source_warnings: _sourceWarnings,
    ...semanticPayload
  } = payload;
  void _sourceFetchedAt;
  void _sourceWarnings;
  return createHash("sha256")
    .update(JSON.stringify(semanticPayload))
    .digest("hex");
}
