import type { SupabaseClient } from "@supabase/supabase-js";
import {
  FALLBACK_PROFESSION_OPTIONS,
  type CpdRuleRequirement,
  type CpdRuleSet,
  type CpdRuleSource,
  type ProfessionOption,
} from "@/lib/cpd/professions";

type Client = SupabaseClient<any>;

export type LegacyActivity = {
  id: string;
  user_id: string;
  type: string;
  points: number;
  year: number;
  organizer: string | null;
  created_at: string;
  updated_at: string;
  status: "planned" | "done";
  planned_start_date: string | null;
  training_id: string | null;
  certificate_path: string | null;
  certificate_name: string | null;
  certificate_mime: string | null;
  certificate_size: number | null;
  certificate_uploaded_at: string | null;
  trainings?: LegacyTraining | null;
};

export type LegacyActivityDocument = {
  id: string;
  user_id: string;
  activity_id: string;
  kind: string;
  path: string;
  name: string | null;
  mime: string | null;
  size: number | null;
  uploaded_at: string;
};

export type LegacyTraining = {
  id?: string;
  title: string;
  organizer: string | null;
  organizer_logo_url?: string | null;
  organizer_logo_path?: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time?: string | null;
  end_time?: string | null;
  time_zone?: string | null;
  speakers?: string[] | null;
  external_url: string | null;
  points?: number | null;
  type?: string | null;
  format?: string | null;
  category?: string | null;
  profession?: string | null;
  audience_scope?: "unknown" | "specific" | "all_medical";
  profession_rules?: TrainingProfessionRule[];
  points_verification_status?: PointVerificationStatus;
  points_source_url?: string | null;
  points_verified_on?: string | null;
  voivodeship?: string | null;
  is_partner?: boolean;
  topics?: string[] | null;
  price_pln?: number | null;
  has_recording?: boolean | null;
  capacity?: number | null;
  enrollment_status?: string | null;
  approval_status?: string | null;
  submitted_by?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  status?: string | null;
  reject_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  description?: string | null;
  url?: string | null;
  user_id?: string | null;
  submitted_email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PointVerificationStatus =
  | "unverified"
  | "organizer_declared"
  | "verified";

export type TrainingProfessionRule = {
  profession_id: string;
  profession_code: string;
  profession_name: string;
  points: number | null;
  verification_status: PointVerificationStatus;
  source_url: string | null;
  verified_on: string | null;
};

export type LegacyProfile = {
  user_id: string;
  profession: string;
  profession_other: string | null;
  profession_id?: string | null;
  profession_code?: string | null;
  period_start: number;
  period_end: number;
  required_points: number;
  pwz_number: string | null;
  pwz_issue_date: string | null;
  role: string;
  can_org_report: boolean;
  cycle_id?: string | null;
  cycle_source?: string | null;
  cycle_target_mode?: "custom" | "rule_set";
  cycle_rule_set_id?: string | null;
  formal_status?: "not_confirmed" | "confirmed_externally";
  suggested_rule_set?: CpdRuleSet | null;
  applied_rule_set?: CpdRuleSet | null;
};

export type ActivityInput = {
  type: string;
  points: number;
  year: number;
  organizer?: string | null;
  status?: "planned" | "done" | "completed";
  planned_start_date?: string | null;
  training_id?: string | null;
  title?: string | null;
};

const OLD_TYPE_BY_CODE: Record<string, string> = {
  conference: "Konferencja / kongres",
  course: "Kurs stacjonarny",
  internship: "Staż / praktyka",
  lecture: "Prowadzenie szkolenia",
  other: "Inna aktywność",
  publication: "Publikacja naukowa",
  self_study: "Samokształcenie",
  webinar: "Kurs online / webinar",
  workshop: "Warsztaty praktyczne",
};

const CODE_BY_OLD_TYPE: Record<string, string> = {
  "konferencja / kongres": "conference",
  "konferencja, kongres lub sympozjum": "conference",
  "kurs online / webinar": "webinar",
  "webinar lub szkolenie online": "webinar",
  "kurs stacjonarny": "course",
  "kurs lub szkolenie": "course",
  "szkolenie wewnętrzne": "course",
  "warsztaty praktyczne": "workshop",
  warsztaty: "workshop",
  "publikacja naukowa": "publication",
  "publikacja naukowa lub zawodowa": "publication",
  "prowadzenie szkolenia": "lecture",
  "wykład lub prowadzenie zajęć": "lecture",
  samokształcenie: "self_study",
  "prenumerata czasopisma": "self_study",
  "staż / praktyka": "internship",
  "staż lub praktyka zawodowa": "internship",
  "towarzystwo/kolegium": "other",
  "inna aktywność": "other",
};

function asNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toRuleSource(row: Record<string, any>): CpdRuleSource {
  return {
    id: row.id,
    source_kind: row.source_kind,
    title: row.title,
    url: row.url,
    published_on: row.published_on ?? null,
    verified_on: row.verified_on,
    is_primary: Boolean(row.is_primary),
  };
}

function toRuleRequirement(row: Record<string, any>): CpdRuleRequirement {
  return {
    id: row.id,
    activity_type_id: row.activity_type_id ?? null,
    requirement_kind: row.requirement_kind,
    scope: row.scope,
    points: asNumber(row.points),
    note_pl: row.note_pl ?? null,
    sort_order: Number(row.sort_order ?? 0),
  };
}

async function hydrateRuleSet(
  client: Client,
  row: Record<string, any> | null | undefined,
): Promise<CpdRuleSet | null> {
  if (!row) return null;

  const [sourcesResult, requirementsResult] = await Promise.all([
    client
      .from("cpd_rule_sources")
      .select(
        "id,source_kind,title,url,published_on,verified_on,is_primary",
      )
      .eq("rule_set_id", row.id)
      .order("is_primary", { ascending: false }),
    client
      .from("cpd_rule_requirements")
      .select(
        "id,activity_type_id,requirement_kind,scope,points,note_pl,sort_order",
      )
      .eq("rule_set_id", row.id)
      .order("sort_order", { ascending: true }),
  ]);

  if (sourcesResult.error) throw new Error(sourcesResult.error.message);
  if (requirementsResult.error)
    throw new Error(requirementsResult.error.message);

  return {
    id: row.id,
    profession_id: row.profession_id,
    version: row.version,
    name_pl: row.name_pl,
    status: row.status,
    calculation_scope: row.calculation_scope,
    valid_from: row.valid_from ?? null,
    valid_to: row.valid_to ?? null,
    period_months:
      row.period_months == null ? null : Number(row.period_months),
    required_points:
      row.required_points == null ? null : asNumber(row.required_points),
    formal_confirmation_authority:
      row.formal_confirmation_authority ?? null,
    summary_pl: row.summary_pl ?? null,
    disclaimer_pl: row.disclaimer_pl,
    last_verified_on: row.last_verified_on ?? null,
    sources: ((sourcesResult.data ?? []) as Record<string, any>[]).map(
      toRuleSource,
    ),
    requirements: (
      (requirementsResult.data ?? []) as Record<string, any>[]
    ).map(toRuleRequirement),
  };
}

const RULE_SET_COLUMNS =
  "id,profession_id,version,name_pl,status,calculation_scope,valid_from,valid_to,period_months,required_points,formal_confirmation_authority,summary_pl,disclaimer_pl,last_verified_on";

export async function fetchProfessionCatalog(
  client: Client,
): Promise<ProfessionOption[]> {
  const { data, error } = await client
    .from("professions")
    .select(
      "id,code,name_pl,name_pl_plural,description_pl,identifier_label,is_other,sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_pl", { ascending: true });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Record<string, any>[];
  if (!rows.length) return [...FALLBACK_PROFESSION_OPTIONS];

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name_pl: row.name_pl,
    name_pl_plural: row.name_pl_plural ?? null,
    description_pl: row.description_pl ?? null,
    identifier_label: row.identifier_label ?? null,
    is_other: Boolean(row.is_other),
    sort_order: Number(row.sort_order ?? 0),
  }));
}

export async function fetchVerifiedRuleSet(
  client: Client,
  professionId: string,
  onDate = new Date().toISOString().slice(0, 10),
): Promise<CpdRuleSet | null> {
  const { data, error } = await client
    .from("cpd_rule_sets")
    .select(RULE_SET_COLUMNS)
    .eq("profession_id", professionId)
    .eq("status", "verified")
    .lte("valid_from", onDate)
    .or(`valid_to.is.null,valid_to.gte.${onDate}`)
    .order("valid_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return hydrateRuleSet(client, data as Record<string, any> | null);
}

async function fetchRuleSetById(
  client: Client,
  ruleSetId: string | null | undefined,
): Promise<CpdRuleSet | null> {
  if (!ruleSetId) return null;
  const { data, error } = await client
    .from("cpd_rule_sets")
    .select(RULE_SET_COLUMNS)
    .eq("id", ruleSetId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return hydrateRuleSet(client, data as Record<string, any> | null);
}

function yearFromActivity(row: Record<string, any>) {
  const raw = row.completed_on || row.starts_on || row.created_at;
  const parsed = Number(String(raw ?? "").slice(0, 4));
  return Number.isFinite(parsed) && parsed > 1900
    ? parsed
    : new Date().getFullYear();
}

function toLegacyTraining(row: Record<string, any>): LegacyTraining {
  const legacy = (row.legacy_data ?? {}) as Record<string, unknown>;
  const professionRules = (
    (row.training_profession_rules ?? []) as Record<string, any>[]
  ).map((rule) => {
    const profession = Array.isArray(rule.profession)
      ? rule.profession[0]
      : rule.profession;
    return {
      profession_id: rule.profession_id,
      profession_code: profession?.code ?? "",
      profession_name: profession?.name_pl ?? "Nieznany zawód",
      points: rule.points == null ? null : asNumber(rule.points),
      verification_status:
        (rule.verification_status as PointVerificationStatus) ?? "unverified",
      source_url: rule.source_url ?? null,
      verified_on: rule.verified_on ?? null,
    };
  });
  const audienceScope = (row.audience_scope ?? "unknown") as
    | "unknown"
    | "specific"
    | "all_medical";
  const normalizedProfession =
    audienceScope === "all_medical"
      ? "Wszyscy medycy"
      : professionRules.length
        ? professionRules.map((rule) => rule.profession_name).join(", ")
        : row.target_profession_text ?? null;
  return {
    id: row.id,
    title: row.title,
    organizer: row.organizer_name ?? null,
    organizer_logo_url: row.organizer_logo_url ?? null,
    organizer_logo_path: row.organizer_logo_path ?? null,
    points: row.points == null ? null : asNumber(row.points),
    type: (legacy.legacy_type as string | null) ?? null,
    start_date: row.starts_on ?? null,
    end_date: row.ends_on ?? null,
    start_time: row.start_time ?? null,
    end_time: row.end_time ?? null,
    time_zone: row.time_zone ?? "Europe/Warsaw",
    speakers: Array.isArray(row.speakers) ? row.speakers : [],
    category: row.category ?? null,
    profession: normalizedProfession,
    audience_scope: audienceScope,
    profession_rules: professionRules,
    points_verification_status:
      (row.points_verification_status as PointVerificationStatus) ??
      "unverified",
    points_source_url: row.points_source_url ?? null,
    points_verified_on: row.points_verified_on ?? null,
    voivodeship: row.location ?? null,
    external_url: row.external_url ?? null,
    is_partner: Boolean(row.is_partner),
    format:
      row.delivery_format === "in_person"
        ? "stacjonarne"
        : row.delivery_format === "online"
          ? "online"
          : row.delivery_format === "hybrid"
            ? "hybrydowe"
            : null,
    topics: row.topics ?? null,
    price_pln: row.price_pln == null ? null : asNumber(row.price_pln),
    has_recording: row.has_recording ?? null,
    capacity: row.capacity ?? null,
    enrollment_status: row.enrollment_status ?? null,
    approval_status: row.approval_status,
    submitted_by: row.submitted_by ?? null,
    approved_by: row.approved_by ?? null,
    approved_at: row.approved_at ?? null,
    status: row.approval_status,
    reject_reason: row.reject_reason ?? null,
    reviewed_by: row.approved_by ?? null,
    reviewed_at: row.approved_at ?? null,
    description: row.description ?? null,
    url: row.external_url ?? null,
    user_id: row.submitted_by ?? null,
    submitted_email: row.submitted_email ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function fetchActivityDocuments(
  client: Client,
  userId: string,
  activityIds?: string[],
): Promise<LegacyActivityDocument[]> {
  let query = client
    .from("activity_documents")
    .select("id,user_id,activity_id,kind,path,name,mime,size,uploaded_at")
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });

  if (activityIds) {
    if (!activityIds.length) return [];
    query = query.in("activity_id", activityIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as LegacyActivityDocument[];
}

export async function fetchActivities(
  client: Client,
  userId: string,
  options: { includeCertificateFields?: boolean } = {},
): Promise<LegacyActivity[]> {
  const { data: activityRows, error: activitiesError } = await client
    .from("educational_activities")
    .select(
      "id,user_id,cycle_id,activity_type_id,title,organizer_name,delivery_format,status,starts_on,ends_on,completed_on,created_at,updated_at,training_id",
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (activitiesError) throw new Error(activitiesError.message);

  const rows = (activityRows ?? []) as Record<string, any>[];
  if (!rows.length) return [];

  const activityIds = rows.map((row) => row.id);
  const typeIds = [...new Set(rows.map((row) => row.activity_type_id).filter(Boolean))];
  const trainingIds = [...new Set(rows.map((row) => row.training_id).filter(Boolean))];

  // Punkty są częścią podstawowego wyniku. Pozostałe zapytania służą tylko
  // do wzbogacenia widoku i nie mogą wyzerować całego panelu, jeśli np.
  // użytkownik nie ma dostępu do rekordu szkolenia albo dokumentu.
  const pointsResult = await client
    .from("activity_point_entries")
    .select("activity_id,points")
    .in("activity_id", activityIds);
  if (pointsResult.error) throw new Error(pointsResult.error.message);

  if (!(pointsResult.data ?? []).length) {
    throw new Error(
      "Aktywności są widoczne, ale nie można odczytać ich punktów. Sprawdź politykę SELECT/RLS tabeli activity_point_entries.",
    );
  }

  const [typesResult, trainingsResult, documentsResult] = await Promise.all([
    typeIds.length
      ? client
          .from("activity_types")
          .select("id,code,name_pl")
          .in("id", typeIds)
      : Promise.resolve({ data: [], error: null }),
    trainingIds.length
      ? client
          .from("trainings")
          .select(
            "id,title,organizer_name,points,delivery_format,starts_on,ends_on,category,target_profession_text,location,external_url,is_partner,topics,price_pln,has_recording,capacity,enrollment_status,approval_status,submitted_by,approved_by,approved_at,reject_reason,description,submitted_email,legacy_data,created_at,updated_at",
          )
          .in("id", trainingIds)
      : Promise.resolve({ data: [], error: null }),
    options.includeCertificateFields
      ? fetchActivityDocuments(client, userId, activityIds)
          .then((data) => ({ data, error: null }))
          .catch((error: unknown) => ({ data: [], error }))
      : Promise.resolve({ data: [], error: null }),
  ]);

  const documents = documentsResult.data;

  const points = new Map<string, number>();
  for (const entry of (pointsResult.data ?? []) as Record<string, any>[]) {
    points.set(
      entry.activity_id,
      (points.get(entry.activity_id) ?? 0) + asNumber(entry.points),
    );
  }

  const types = new Map(
    ((typesResult.data ?? []) as Record<string, any>[]).map((row) => [
      row.id,
      row,
    ]),
  );
  const trainings = new Map(
    ((trainingsResult.data ?? []) as Record<string, any>[]).map((row) => [
      row.id,
      toLegacyTraining(row),
    ]),
  );
  const certificateByActivity = new Map<string, LegacyActivityDocument>();
  for (const document of documents) {
    if (
      document.kind.toLowerCase() === "certificate" &&
      !certificateByActivity.has(document.activity_id)
    ) {
      certificateByActivity.set(document.activity_id, document);
    }
  }

  return rows.map((row) => {
    const activityType = types.get(row.activity_type_id);
    const certificate = certificateByActivity.get(row.id);
    const preservedLegacyType = [
      "Prenumerata czasopisma",
      "Szkolenie wewnętrzne",
      "Towarzystwo/Kolegium",
    ].includes(row.title)
      ? row.title
      : null;
    return {
      id: row.id,
      user_id: row.user_id,
      type:
        preservedLegacyType ??
        OLD_TYPE_BY_CODE[activityType?.code] ??
        activityType?.name_pl ??
        row.title ??
        "Inna aktywność",
      points: points.get(row.id) ?? 0,
      year: yearFromActivity(row),
      organizer: row.organizer_name ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      status: row.status === "completed" ? "done" : "planned",
      planned_start_date: row.starts_on ?? null,
      training_id: row.training_id ?? null,
      certificate_path: certificate?.path ?? null,
      certificate_name: certificate?.name ?? null,
      certificate_mime: certificate?.mime ?? null,
      certificate_size: certificate?.size ?? null,
      certificate_uploaded_at: certificate?.uploaded_at ?? null,
      trainings: row.training_id ? trainings.get(row.training_id) ?? null : null,
    };
  });
}

export async function fetchActivity(
  client: Client,
  userId: string,
  activityId: string,
): Promise<LegacyActivity | null> {
  const rows = await fetchActivities(client, userId, {
    includeCertificateFields: true,
  });
  return rows.find((row) => row.id === activityId) ?? null;
}

async function resolveActivityTypeId(client: Client, type: string) {
  const normalized = type.trim().toLocaleLowerCase("pl-PL");
  const preferredCode = CODE_BY_OLD_TYPE[normalized] ?? "other";
  const { data, error } = await client
    .from("activity_types")
    .select("id,code,name_pl")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Record<string, any>[];
  const match =
    rows.find((row) => row.code === preferredCode) ??
    rows.find(
      (row) =>
        String(row.name_pl ?? "").toLocaleLowerCase("pl-PL") === normalized,
    ) ??
    rows.find((row) => row.code === "other");

  if (!match) throw new Error("Brak aktywnego typu aktywności w bazie.");
  return match.id as string;
}

async function resolveCycleId(client: Client, userId: string, year: number) {
  const date = `${year}-12-31`;
  const { data, error } = await client
    .from("cpd_cycles")
    .select("id,starts_on,ends_on,status")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .lte("starts_on", date)
    .gte("ends_on", date)
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

export async function createActivity(
  client: Client,
  userId: string,
  input: ActivityInput,
) {
  const points = Math.max(0, asNumber(input.points));
  const year = Math.round(asNumber(input.year)) || new Date().getFullYear();
  const status =
    input.status === "planned" ? ("planned" as const) : ("completed" as const);
  const activityTypeId = await resolveActivityTypeId(client, input.type);
  const cycleId = await resolveCycleId(client, userId, year);
  const startsOn = input.planned_start_date ?? null;
  const completedOn =
    status === "completed" ? input.planned_start_date ?? `${year}-12-31` : null;

  const { data, error } = await client
    .from("educational_activities")
    .insert({
      user_id: userId,
      cycle_id: cycleId,
      activity_type_id: activityTypeId,
      title: input.title?.trim() || input.type,
      organizer_name: input.organizer?.trim() || null,
      status,
      starts_on: startsOn,
      completed_on: completedOn,
      training_id: input.training_id ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const { error: pointsError } = await client
    .from("activity_point_entries")
    .insert({
      activity_id: data.id,
      points,
      point_kind: "claimed",
      description: "Punkty zadeklarowane przez użytkownika.",
      created_by: userId,
    });

  if (pointsError) {
    await client
      .from("educational_activities")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    throw new Error(pointsError.message);
  }

  return data.id as string;
}

export async function updateActivity(
  client: Client,
  userId: string,
  activityId: string,
  input: Partial<ActivityInput>,
) {
  const patch: Record<string, unknown> = {};
  if (input.type !== undefined) {
    patch.activity_type_id = await resolveActivityTypeId(client, input.type);
    patch.title = input.title?.trim() || input.type;
  } else if (input.title !== undefined) {
    patch.title = input.title?.trim();
  }
  if (input.organizer !== undefined)
    patch.organizer_name = input.organizer?.trim() || null;
  if (input.training_id !== undefined)
    patch.training_id = input.training_id ?? null;
  if (input.planned_start_date !== undefined)
    patch.starts_on = input.planned_start_date ?? null;
  if (input.status !== undefined) {
    patch.status = input.status === "planned" ? "planned" : "completed";
    const year = input.year ?? new Date().getFullYear();
    patch.completed_on =
      input.status === "planned"
        ? null
        : input.planned_start_date ?? `${year}-12-31`;
  }
  if (input.year !== undefined && input.status !== "planned") {
    patch.completed_on =
      input.planned_start_date ?? `${Math.round(input.year)}-12-31`;
  }

  if (Object.keys(patch).length) {
    const { error } = await client
      .from("educational_activities")
      .update(patch)
      .eq("id", activityId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  }

  if (input.points !== undefined) {
    const { data: existing, error: lookupError } = await client
      .from("activity_point_entries")
      .select("id")
      .eq("activity_id", activityId)
      .eq("created_by", userId)
      .eq("point_kind", "claimed")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);

    const points = Math.max(0, asNumber(input.points));
    const result = existing
      ? await client
          .from("activity_point_entries")
          .update({ points })
          .eq("id", existing.id)
          .eq("created_by", userId)
      : await client.from("activity_point_entries").insert({
          activity_id: activityId,
          points,
          point_kind: "claimed",
          description: "Punkty zadeklarowane przez użytkownika.",
          created_by: userId,
        });
    if (result.error) throw new Error(result.error.message);
  }
}

export async function deleteActivity(
  client: Client,
  userId: string,
  activityId: string,
) {
  const { error } = await client
    .from("educational_activities")
    .delete()
    .eq("id", activityId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function fetchProfile(
  client: Client,
  userId: string,
): Promise<LegacyProfile | null> {
  const [professionalResult, cyclesResult] = await Promise.all([
      client
        .from("medical_professionals")
        .select("user_id,profession_id,professional_status")
        .eq("user_id", userId)
        .maybeSingle(),
      client
        .from("cpd_cycles")
        .select(
          "id,profession_id,starts_on,ends_on,required_points,status,source,rule_set_id,target_mode,formal_status",
        )
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("starts_on", { ascending: false }),
    ]);

  // Identyfikator i rola administracyjna są opcjonalne. W szczególności
  // platform_staff_roles ma celowo restrykcyjne RLS i brak dostępu do tej
  // tabeli nie może powodować utraty okresu CPD w panelu użytkownika.
  const [identifiersResult, staffResult] = await Promise.all([
      client
        .from("professional_identifiers")
        .select(
          "identifier_value,issued_on,verification_status,created_at",
        )
        .eq("user_id", userId)
        .eq("identifier_type", "pwz")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from("platform_staff_roles")
        .select("role_code")
        .eq("user_id", userId)
        .is("revoked_at", null),
  ]);

  if (professionalResult.error)
    throw new Error(professionalResult.error.message);
  if (cyclesResult.error) throw new Error(cyclesResult.error.message);
  if (!professionalResult.data) return null;
  const professionId = professionalResult.data.profession_id;

  const { data: profession, error: professionError } = await client
    .from("professions")
    .select("id,code,name_pl")
    .eq("id", professionId)
    .maybeSingle();
  if (professionError) throw new Error(professionError.message);

  // Użytkownik może mieć historyczne cykle dla więcej niż jednego zawodu.
  // Profil musi korzystać wyłącznie z cyklu przypisanego do aktualnego zawodu,
  // inaczej po zmianie zawodu panel może pokazać niewłaściwy okres i limit.
  const cycles = ((cyclesResult.data ?? []) as Record<string, any>[]).filter(
    (row) => row.profession_id === professionId,
  );
  const today = new Date().toISOString().slice(0, 10);
  const cycle =
    cycles.find(
      (row) => row.starts_on <= today && row.ends_on >= today,
    ) ?? cycles[0];
  const professionName =
    profession?.code === "other_medical_profession"
      ? "Inne"
      : profession?.name_pl ?? "Lekarz";
  const [appliedRuleSet, suggestedRuleSet] = await Promise.all([
    fetchRuleSetById(client, cycle?.rule_set_id ?? null),
    professionId
      ? fetchVerifiedRuleSet(client, professionId)
      : Promise.resolve(null),
  ]);

  return {
    user_id: userId,
    profession: professionName,
    profession_other: null,
    profession_id: professionId ?? null,
    profession_code: profession?.code ?? null,
    period_start: cycle ? Number(String(cycle.starts_on).slice(0, 4)) : 2023,
    period_end: cycle ? Number(String(cycle.ends_on).slice(0, 4)) : 2026,
    required_points: cycle ? asNumber(cycle.required_points) : 0,
    pwz_number: identifiersResult.error
      ? null
      : identifiersResult.data?.identifier_value ?? null,
    pwz_issue_date: identifiersResult.error
      ? null
      : identifiersResult.data?.issued_on ?? null,
    role: (!staffResult.error && (staffResult.data ?? []).some(
      (row: Record<string, any>) => row.role_code === "platform_admin",
    ))
      ? "admin"
      : "user",
    can_org_report: false,
    cycle_id: cycle?.id ?? null,
    cycle_source: cycle?.source ?? null,
    cycle_target_mode: cycle?.target_mode ?? "custom",
    cycle_rule_set_id: cycle?.rule_set_id ?? null,
    formal_status: cycle?.formal_status ?? "not_confirmed",
    applied_rule_set: appliedRuleSet,
    suggested_rule_set: suggestedRuleSet,
  };
}

export async function saveProfile(
  client: Client,
  userId: string,
  input: {
    profession: string;
    profession_other?: string | null;
    period_start: number;
    period_end: number;
    required_points: number;
    pwz_number?: string | null;
    pwz_issue_date?: string | null;
  },
) {
  let professionQuery = client
    .from("professions")
    .select("id")
    .eq("is_active", true);

  professionQuery =
    input.profession === "Inne"
      ? professionQuery.eq("is_other", true)
      : professionQuery.eq("name_pl", input.profession);

  const { data: profession, error: professionError } =
    await professionQuery.maybeSingle();
  if (professionError) throw new Error(professionError.message);
  if (!profession) throw new Error("Wybrany zawód nie istnieje w bazie.");

  const { error: professionalError } = await client
    .from("medical_professionals")
    .upsert(
      {
        user_id: userId,
        profession_id: profession.id,
        professional_status: "active",
      },
      { onConflict: "user_id" },
    );
  if (professionalError) throw new Error(professionalError.message);

  const startsOn = `${input.period_start}-01-01`;
  const endsOn = `${input.period_end}-12-31`;
  const { data: existingCycle, error: cycleLookupError } = await client
    .from("cpd_cycles")
    .select("id,source,required_points")
    .eq("user_id", userId)
    .eq("profession_id", profession.id)
    .eq("starts_on", startsOn)
    .eq("ends_on", endsOn)
    .maybeSingle();
  if (cycleLookupError) throw new Error(cycleLookupError.message);

  if (
    existingCycle &&
    ["user", "migration"].includes(existingCycle.source)
  ) {
    const { error } = await client
      .from("cpd_cycles")
      .update({
        required_points: Math.max(0, input.required_points),
        status: "active",
      })
      .eq("id", existingCycle.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  } else if (!existingCycle) {
    const { error } = await client.from("cpd_cycles").insert({
      user_id: userId,
      profession_id: profession.id,
      name: `Okres CPD ${input.period_start}-${input.period_end}`,
      starts_on: startsOn,
      ends_on: endsOn,
      required_points: Math.max(0, input.required_points),
      status: "active",
      source: "user",
    });
    if (error) throw new Error(error.message);
  }

  const pwz = input.pwz_number?.trim() || null;
  const { data: currentIdentifier, error: identifierLookupError } = await client
    .from("professional_identifiers")
    .select("id,identifier_value,verification_status")
    .eq("user_id", userId)
    .eq("identifier_type", "pwz")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (identifierLookupError) throw new Error(identifierLookupError.message);

  if (
    pwz &&
    currentIdentifier &&
    ["unverified", "rejected"].includes(currentIdentifier.verification_status)
  ) {
    const { error } = await client
      .from("professional_identifiers")
      .update({
        identifier_value: pwz,
        issued_on: input.pwz_issue_date ?? null,
        verification_status: "unverified",
        verified_at: null,
      })
      .eq("id", currentIdentifier.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  } else if (pwz && !currentIdentifier) {
    const { error } = await client.from("professional_identifiers").insert({
      user_id: userId,
      identifier_type: "pwz",
      identifier_value: pwz,
      issuing_country_code: "PL",
      verification_status: "unverified",
      issued_on: input.pwz_issue_date ?? null,
    });
    if (error) throw new Error(error.message);
  }
}

export async function fetchTrainings(client: Client): Promise<LegacyTraining[]> {
  const { data, error } = await client
    .from("trainings")
    .select(
      "id,title,organizer_name,organizer_logo_url,organizer_logo_path,points,delivery_format,starts_on,ends_on,start_time,end_time,time_zone,speakers,category,target_profession_text,audience_scope,points_verification_status,points_source_url,points_verified_on,location,external_url,is_partner,topics,price_pln,has_recording,capacity,enrollment_status,approval_status,submitted_by,approved_by,approved_at,reject_reason,description,submitted_email,legacy_data,created_at,updated_at,training_profession_rules(profession_id,points,verification_status,source_url,verified_on,profession:professions!training_profession_rules_profession_id_fkey(code,name_pl))",
    )
    .order("starts_on", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, any>[]).map(toLegacyTraining);
}

/**
 * Publiczny katalog pobiera wyłącznie kolumny dopuszczone dla roli `anon`.
 * Dane zgłaszającego, ślady moderacji i legacy_data nigdy nie trafiają do
 * niezalogowanego klienta. Widoczność wierszy ogranicza dodatkowo RLS.
 */
export async function fetchPublicTrainings(
  client: Client,
  signal?: AbortSignal,
): Promise<LegacyTraining[]> {
  let query = client
    .from("trainings")
    .select(
      "id,title,organizer_name,organizer_logo_url,points,delivery_format,starts_on,ends_on,start_time,end_time,time_zone,speakers,category,target_profession_text,audience_scope,points_verification_status,points_source_url,points_verified_on,location,external_url,is_partner,topics,price_pln,has_recording,capacity,enrollment_status,approval_status,description,created_at,updated_at,training_profession_rules(profession_id,points,verification_status,source_url,verified_on,profession:professions!training_profession_rules_profession_id_fkey(code,name_pl))",
    )
    .eq("approval_status", "approved")
    .order("starts_on", { ascending: true, nullsFirst: false });

  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, any>[]).map(toLegacyTraining);
}

export async function fetchPublicTrainingById(
  client: Client,
  trainingId: string,
): Promise<LegacyTraining | null> {
  const { data, error } = await client
    .from("trainings")
    .select(
      "id,title,organizer_name,organizer_logo_url,points,delivery_format,starts_on,ends_on,start_time,end_time,time_zone,speakers,category,target_profession_text,audience_scope,points_verification_status,points_source_url,points_verified_on,location,external_url,is_partner,topics,price_pln,has_recording,capacity,enrollment_status,approval_status,description,created_at,updated_at,training_profession_rules(profession_id,points,verification_status,source_url,verified_on,profession:professions!training_profession_rules_profession_id_fkey(code,name_pl))",
    )
    .eq("approval_status", "approved")
    .eq("id", trainingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toLegacyTraining(data as Record<string, any>) : null;
}

export function toNormalizedTraining(
  input: Partial<LegacyTraining> & { title: string },
) {
  return {
    title: input.title,
    organizer_name: input.organizer ?? null,
    organizer_logo_url: input.organizer_logo_url ?? null,
    organizer_logo_path: input.organizer_logo_path ?? null,
    points: input.points ?? null,
    delivery_format:
      input.format === "stacjonarne"
        ? "in_person"
        : input.format === "hybrydowe"
          ? "hybrid"
          : input.format === "online"
            ? "online"
            : null,
    starts_on: input.start_date ?? null,
    ends_on: input.end_date ?? null,
    start_time: input.start_time ?? null,
    end_time: input.end_time ?? null,
    time_zone: input.time_zone?.trim() || "Europe/Warsaw",
    speakers: Array.from(
      new Set(
        (input.speakers ?? [])
          .map((speaker) => speaker.trim())
          .filter(Boolean),
      ),
    ),
    category: input.category ?? null,
    target_profession_text: input.profession ?? null,
    audience_scope: input.audience_scope ?? "unknown",
    points_verification_status:
      input.points_verification_status ?? "unverified",
    points_source_url: input.points_source_url ?? null,
    points_verified_on: input.points_verified_on ?? null,
    location: input.voivodeship ?? null,
    external_url: input.external_url ?? input.url ?? null,
    is_partner: Boolean(input.is_partner),
    topics: input.topics ?? null,
    price_pln: input.price_pln ?? null,
    has_recording: input.has_recording ?? null,
    capacity: input.capacity ?? null,
    enrollment_status: input.enrollment_status ?? null,
    approval_status: input.approval_status ?? "pending",
    submitted_by: input.submitted_by ?? input.user_id ?? null,
    reject_reason: input.reject_reason ?? null,
    description: input.description ?? null,
    submitted_email: input.submitted_email ?? null,
  };
}
