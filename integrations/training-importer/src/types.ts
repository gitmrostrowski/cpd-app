export type DeliveryFormat = "online" | "in_person" | "hybrid";
export type TrainingCategory =
  | "kurs"
  | "konferencja"
  | "warsztaty"
  | "publikacja"
  | "szkolenie"
  | "inne";
export type ScheduleStatus = "scheduled" | "to_be_determined";

export type TrainingImportPayload = {
  source_external_id: string;
  source_url: string;
  source_fetched_at: string;
  title: string;
  organizer: string;
  points: number | null;
  delivery_format: DeliveryFormat;
  category: TrainingCategory;
  schedule_status: ScheduleStatus;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  time_zone: string;
  speakers: string[];
  voivodeship: string | null;
  external_url: string;
  topics: string[];
  price_pln: number | null;
  has_recording: boolean | null;
  capacity: number | null;
  enrollment_status: "open" | "waiting_list" | "closed" | null;
  description: string | null;
  source_warnings: string[];
  audience_scope: "specific";
  profession_codes: string[];
};

export type SkippedItem = {
  title: string;
  reason: string;
};

export type AdapterResult = {
  payloads: TrainingImportPayload[];
  skipped: SkippedItem[];
  sourceItemCount: number;
};

export type SourceAdapter = {
  code: string;
  feedUrl: string;
  parse(
    xml: string,
    options?: {
      fetchedAt?: string;
      asOfDate?: string;
      includeFullDescriptions?: boolean;
    },
  ): AdapterResult;
};

export type ImportApiResult = {
  status:
    | "created"
    | "unchanged"
    | "would_create"
    | "would_be_unchanged"
    | "would_queue_change"
    | "would_be_change_pending"
    | "would_be_change_rejected"
    | "change_queued"
    | "change_pending"
    | "change_rejected";
  training_id: string | null;
  source_external_id: string;
};
