import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Info,
  MapPin,
  Users,
} from "lucide-react";
import { fetchPublicTrainingById } from "@/lib/data/crpe";
import { getSiteUrl } from "@/lib/siteUrl";
import { publicSupabaseServer } from "@/lib/supabase/publicServer";
import {
  pointVerificationLabel,
  publicTrainingPointsLabel,
  trainingIdFromSlug,
  trainingPath,
} from "@/lib/trainings/public";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

const getTraining = cache(async (slug: string) => {
  const id = trainingIdFromSlug(slug);
  if (!id) return null;
  try {
    return await fetchPublicTrainingById(publicSupabaseServer(), id);
  } catch (error) {
    console.error("Public training detail load failed", error);
    return null;
  }
});

function formatDate(value: string | null) {
  if (!value) return "Nie podano";
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "long" }).format(
    new Date(`${value}T00:00:00`),
  );
}

function formatPrice(value: number | null | undefined) {
  if (typeof value !== "number") return "Cena niepodana";
  if (value === 0) return "Bezpłatne";
  return `${value.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł`;
}

function formatDelivery(value: string | null | undefined) {
  if (value === "stacjonarne") return "Stacjonarne";
  if (value === "hybrydowe") return "Hybrydowe";
  if (value === "online") return "Online / webinar";
  return "Forma niepodana";
}

function formatTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
  timeZone: string | null | undefined,
) {
  if (!start) return null;
  const hours = end
    ? `${start.slice(0, 5)}–${end.slice(0, 5)}`
    : start.slice(0, 5);
  return `${hours} · ${timeZone || "Europe/Warsaw"}`;
}

function schemaDateTime(
  date: string | undefined,
  time: string | null | undefined,
  timeZone: string | null | undefined,
) {
  if (!date) return undefined;
  if (!time) return date;
  const zone = timeZone || "Europe/Warsaw";
  try {
    const zoneName = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "longOffset",
    })
      .formatToParts(new Date(`${date}T12:00:00Z`))
      .find((part) => part.type === "timeZoneName")?.value;
    if (zoneName === "GMT") return `${date}T${time.slice(0, 5)}:00Z`;
    const offset = zoneName?.match(/^GMT([+-]\d{2}:\d{2})$/)?.[1];
    return `${date}T${time.slice(0, 5)}:00${offset || ""}`;
  } catch {
    return `${date}T${time.slice(0, 5)}:00`;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const training = await getTraining(slug);
  if (!training) return { title: "Szkolenie niedostępne — CRPE" };

  const description =
    training.description?.slice(0, 155) ||
    `${publicTrainingPointsLabel(training)}. ${formatDelivery(training.format)}. Sprawdź termin i zapisy u organizatora.`;
  const canonical = trainingPath(training);

  return {
    title: `${training.title} — szkolenie medyczne | CRPE`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: training.title,
      description,
      url: canonical,
      images: training.organizer_logo_url ? [training.organizer_logo_url] : undefined,
    },
  };
}

export default async function TrainingPage({ params }: PageProps) {
  const { slug } = await params;
  const training = await getTraining(slug);
  if (!training) notFound();

  const canonicalPath = trainingPath(training);
  if (`/baza-szkolen/${slug}` !== canonicalPath) permanentRedirect(canonicalPath);

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const startDate = training.start_date || undefined;
  const endDate = training.end_date || startDate;
  const starts = schemaDateTime(startDate, training.start_time, training.time_zone);
  const ends = schemaDateTime(endDate, training.end_time, training.time_zone);
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: training.title,
    description: training.description || undefined,
    url: canonicalUrl,
    provider: training.organizer
      ? { "@type": "Organization", name: training.organizer }
      : undefined,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode:
        training.format === "online"
          ? "online"
          : training.format === "hybrydowe"
            ? "blended"
            : "onsite",
      startDate: starts,
      endDate: ends,
      instructor: training.speakers?.length
        ? training.speakers.map((speaker) => ({ "@type": "Person", name: speaker }))
        : undefined,
      location:
        training.format === "online"
          ? { "@type": "VirtualLocation", url: training.external_url || canonicalUrl }
          : training.voivodeship
            ? { "@type": "Place", name: training.voivodeship }
            : undefined,
    },
  };

  const audience =
    training.audience_scope === "all_medical"
      ? "Wszyscy medycy"
      : training.profession || "Adresaci niepodani";
  const detailItems = [
    {
      icon: CalendarDays,
      label: "Termin",
      value:
        training.schedule_status === "to_be_determined"
          ? "Termin do ustalenia"
          : training.end_date && training.end_date !== training.start_date
          ? `${formatDate(training.start_date)} – ${formatDate(training.end_date)}`
          : formatDate(training.start_date),
      note: formatTimeRange(training.start_time, training.end_time, training.time_zone),
    },
    {
      icon: MapPin,
      label: "Forma i miejsce",
      value: `${formatDelivery(training.format)}${training.voivodeship ? ` · ${training.voivodeship}` : ""}`,
    },
    { icon: GraduationCap, label: "Punkty", value: publicTrainingPointsLabel(training) },
    { icon: Users, label: "Adresaci", value: audience },
    {
      icon: Award,
      label: "Cena",
      value: formatPrice(training.price_pln),
      highlight: training.price_pln === 0,
    },
    {
      icon: CheckCircle2,
      label: "Weryfikacja",
      value: pointVerificationLabel(training.points_verification_status),
    },
  ];

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#eaf1f8] px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd).replace(/</g, "\\u003c") }}
      />
      <article className="mx-auto max-w-4xl overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.10)]">
        <div className="border-b border-slate-200 bg-gradient-to-br from-white to-crpe-brand-soft px-5 py-6 sm:px-8 sm:py-8">
          <Link href="/baza-szkolen" className="text-sm font-semibold text-crpe-brand hover:text-crpe-brand-hover">
            ← Wróć do bazy szkoleń
          </Link>
          <div className="mt-6 flex items-start gap-4">
            {training.organizer_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={training.organizer_logo_url} alt="" className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-contain p-2 shadow-sm" />
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-crpe-brand">{training.organizer || "Organizator niepodany"}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{training.title}</h1>
            </div>
          </div>
        </div>

        <div className="grid gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {detailItems.map(({ icon: ItemIcon, label, value, note, highlight }) => {
                return (
                  <div
                    key={label}
                    className={`rounded-2xl border p-4 ${highlight ? "border-crpe-success-border bg-crpe-success-soft" : "border-slate-200 bg-slate-50"}`}
                  >
                    <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] ${highlight ? "text-crpe-success" : "text-slate-500"}`}>
                      <ItemIcon className="h-4 w-4" />
                      {label}
                    </div>
                    <p className={`mt-2 text-sm font-semibold leading-6 ${highlight ? "text-crpe-success" : "text-slate-900"}`}>
                      {value}
                    </p>
                    {note ? <p className="mt-1 text-xs font-bold text-crpe-brand">{note}</p> : null}
                  </div>
                );
              })}
            </div>

            {training.speakers?.length ? (
              <section className="mt-6">
                <h2 className="text-xl font-bold text-slate-950">Prowadzący</h2>
                <ul className="mt-3 grid gap-2">
                  {training.speakers.map((speaker) => (
                    <li key={speaker} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
                      {speaker}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {training.description ? (
              <section className="mt-6">
                <h2 className="text-xl font-bold text-slate-950">O szkoleniu</h2>
                <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-600">
                  {training.description}
                </p>
              </section>
            ) : !training.speakers?.length ? (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-600">
                  Szczegółowy program znajdziesz {training.external_url ? (
                    <a href={training.external_url} target="_blank" rel="noreferrer" className="font-bold text-crpe-brand hover:text-crpe-brand-hover">na stronie organizatora</a>
                  ) : "po jego opublikowaniu przez organizatora"}.
                </p>
              </section>
            ) : null}

            {training.topics?.length ? (
              <section className="mt-6">
                <h2 className="text-lg font-bold text-slate-950">Tematy</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {training.topics.map((topic) => <span key={topic} className="rounded-full bg-crpe-brand-soft px-3 py-1.5 text-sm font-semibold text-crpe-brand">{topic}</span>)}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="self-start rounded-2xl border border-crpe-brand-border bg-crpe-brand-soft p-4 lg:sticky lg:top-24">
            <div className="flex gap-2 text-sm leading-6 text-crpe-brand"><Info className="mt-1 h-4 w-4 shrink-0" /><p>Dodanie szkolenia do planu CRPE nie jest zapisem. Rejestrację prowadzi organizator.</p></div>
            {training.external_url ? (
              <a href={training.external_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-crpe-brand px-4 text-sm font-bold text-white hover:bg-crpe-brand-hover">
                Zapisy u organizatora <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <p className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold text-slate-600">Link do zapisów nie został podany.</p>
            )}
          </aside>
        </div>
      </article>
    </main>
  );
}
