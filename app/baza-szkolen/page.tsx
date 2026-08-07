import type { Metadata } from "next";
import TrainingHubClient from "./TrainingHubClient";
import { fetchPublicTrainings, type LegacyTraining } from "@/lib/data/crpe";
import { publicSupabaseServer } from "@/lib/supabase/publicServer";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Object.values(params).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  );

  return {
    title: "Szkolenia medyczne z punktami edukacyjnymi — baza CRPE",
    description:
      "Wyszukaj kursy, konferencje i webinary dla zawodów medycznych. Filtruj według punktów edukacyjnych, zawodu, terminu, miejsca i formy szkolenia.",
    alternates: { canonical: "/baza-szkolen" },
    robots: hasFilters ? { index: false, follow: true } : undefined,
  };
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  let initialTrainings: LegacyTraining[] = [];

  try {
    initialTrainings = await fetchPublicTrainings(publicSupabaseServer());
  } catch (error) {
    console.error("SSR public training directory load failed", error);
  }

  return (
    <TrainingHubClient
      initialTrainings={initialTrainings}
      initialSearchParams={params}
    />
  );
}
