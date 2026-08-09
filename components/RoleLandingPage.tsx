import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  FolderOpen,
  GraduationCap,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import RoleContactModal from "@/components/RoleContactModal";

type RoleKind = "medyk" | "placowka" | "organizator";

type Props = {
  role: RoleKind;
};

type RoleContent = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  lead: string;
  status: string;
  statusClass: string;
  availableTitle: string;
  availableText: string;
  available: Array<{ icon: LucideIcon; title: string; text: string }>;
  roadmapTitle: string;
  roadmapText: string;
  roadmap: string[];
  steps: Array<{ title: string; text: string }>;
  faq: Array<[string, string]>;
  contactRole?: "placowka" | "organizator";
};

const wrap = "mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8";

const content: Record<RoleKind, RoleContent> = {
  medyk: {
    icon: Stethoscope,
    eyebrow: "CRPE dla medyka",
    title: "Prowadź własną ewidencję punktów, aktywności i certyfikatów.",
    lead: "Panel CPD, aktywności, dokumenty, raport i baza szkoleń działają w jednym koncie. Zaczynasz od własnego celu i prowadzisz ewidencję we własnym tempie.",
    status: "Dostępne teraz",
    statusClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    availableTitle: "Cały podstawowy warsztat medyka jest dostępny od razu.",
    availableText: "CRPE prowadzi od ustawienia celu, przez dodawanie aktywności, aż do przygotowania zestawienia.",
    available: [
      { icon: BarChart3, title: "Panel CPD i kalkulator", text: "Ustaw okres i własny cel, obserwuj punkty zadeklarowane oraz kompletność dokumentów." },
      { icon: CalendarCheck2, title: "Aktywności i certyfikaty", text: "Dodawaj wpisy, punkty i dokumenty PDF lub zdjęcia certyfikatów." },
      { icon: FileText, title: "Raport użytkownika", text: "Przygotuj zestawienie wybranego okresu oraz eksport dokumentów." },
      { icon: FolderOpen, title: "Baza szkoleń", text: "Wyszukuj wydarzenia i dodawaj wybrane pozycje do własnego planu CPD." },
    ],
    roadmapTitle: "Co warto wiedzieć przed rozpoczęciem",
    roadmapText: "CRPE pomaga prowadzić własną ewidencję, ale nie zastępuje oficjalnego rejestru ani wymaganej procedury rozliczenia.",
    roadmap: [
      "Dokument jest zawsze przypisany do konkretnej aktywności.",
      "Panel CPD pokazuje postęp według ustawionego celu i okresu.",
      "Dodanie szkolenia do planu nie oznacza zapisu u organizatora.",
      "Dane i pliki są dostępne po zalogowaniu.",
    ],
    steps: [
      { title: "Załóż konto", text: "Wybierz zawód, okres rozliczeniowy i wymagany cel." },
      { title: "Dodaj aktywność", text: "Wpisz wydarzenie, datę, kategorię i liczbę punktów." },
      { title: "Dołącz dokument", text: "Dodaj PDF lub zdjęcie certyfikatu do właściwego wpisu." },
      { title: "Sprawdzaj status", text: "Kontroluj postęp, braki i przygotuj raport użytkownika." },
    ],
    faq: [
      ["Czy mogę dodać starsze certyfikaty?", "Tak. Aktywność możesz dodać ręcznie i przypisać do niej posiadany dokument."],
      ["Czy CRPE automatycznie mnie rozlicza?", "Nie. CRPE porządkuje dane i pomaga przygotować zestawienie, ale nie wykonuje oficjalnego rozliczenia w imieniu użytkownika."],
      ["Czy mogę korzystać z telefonu?", "Tak. Widoki są responsywne, a certyfikat możesz dodać także jako zdjęcie."],
      ["Czy raport można pobrać?", "Tak. Raport użytkownika służy do przygotowania zestawienia i eksportu dokumentów."],
    ],
  },
  placowka: {
    icon: Building2,
    eyebrow: "CRPE dla placówki i jednostki",
    title: "Ujednolić ewidencję zespołu i szybciej wychwytywać braki.",
    lead: "Panel pilotażowy łączy indywidualne konta pracowników ze strukturą placówki, zaproszeniami i rolami. Dane pracownika pozostają oddzielone i nie są udostępniane automatycznie.",
    status: "Panel pilotażowy v5",
    statusClass: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    availableTitle: "Co obejmuje pierwszy panel placówki",
    availableText: "Właściciel i administrator mogą zbudować zespół oraz strukturę, a każda osoba nadal korzysta z własnego konta.",
    available: [
      { icon: UserRound, title: "Indywidualne konta", text: "Pracownicy prowadzą własne wpisy, punkty i certyfikaty w spójnym standardzie." },
      { icon: FileCheck2, title: "Zespół i jednostki", text: "Placówka tworzy oddziały, zespoły i przypisuje odpowiedzialność na właściwym poziomie." },
      { icon: FileText, title: "Zaproszenia i role", text: "Dostęp jest nadawany na konkretny e-mail jako właściciel, administrator lub rola operacyjna." },
      { icon: ShieldCheck, title: "Rozdzielenie danych", text: "Członkostwo nie daje automatycznie dostępu do prywatnych certyfikatów pracownika." },
    ],
    roadmapTitle: "Kolejny zakres pilotażu",
    roadmapText: "Fundament dostępu jest gotowy. Kolejne ekrany rozwiną proces pracy na danych dobrowolnie udostępnionych placówce.",
    roadmap: [
      "Widok zbiorczy statusów i kompletności zespołu.",
      "Kolejka weryfikacji aktywności i dokumentów.",
      "Alerty o brakach, terminach i dokumentach.",
      "Raport jednostki oraz eksport danych zgodny z uprawnieniami.",
    ],
    steps: [
      { title: "Ustal zakres", text: "Określ liczbę pracowników, strukturę i oczekiwany poziom raportowania." },
      { title: "Dodaj strukturę", text: "Przygotuj zespoły, role administratorów i sposób nadawania dostępu." },
      { title: "Zaproś pracowników", text: "Każdy prowadzi własne dane i dokumenty w indywidualnym koncie." },
      { title: "Kontroluj kompletność", text: "Administrator widzi uzgodnione statusy, braki i terminy." },
    ],
    faq: [
      ["Czy placówka może założyć jedno konto dla całego zespołu?", "Nie rekomendujemy wspólnego konta. Docelowy model zakłada indywidualne konta pracowników oraz osobne uprawnienia administratora."],
      ["Czy administrator zobaczy wszystkie dokumenty?", "Zakres dostępu powinien wynikać z roli, uprawnień i zasad wdrożenia. Nie zakładamy automatycznie pełnego dostępu do wszystkich danych."],
      ["Czy moduł jest już gotowy?", "Dostępny jest panel pilotażowy z placówką, jednostkami, członkostwami, zaproszeniami i rolami. Weryfikacje oraz raporty zespołu są rozwijane w kolejnych etapach."],
      ["Czy można zacząć od małego zespołu?", "Tak. Rozmowę warto rozpocząć od jednego zespołu lub jednostki pilotażowej."],
    ],
    contactRole: "placowka",
  },
  organizator: {
    icon: GraduationCap,
    eyebrow: "CRPE dla organizatora kształcenia",
    title: "Porządkuj wydarzenia, uczestników i dokumentację edukacyjną.",
    lead: "Zakres narzędzi dla organizatora ustalamy indywidualnie. Punktem wyjścia jest rodzaj wydarzeń, liczba uczestników oraz sposób przygotowania i wydawania dokumentów.",
    status: "Zakres indywidualny",
    statusClass: "bg-blue-50 text-blue-700 ring-blue-100",
    availableTitle: "Jaki proces może wspierać CRPE",
    availableText: "Rozwiązanie może łączyć publikację wydarzeń, obsługę uczestników i dokumentację, ale zakres zależy od faktycznych potrzeb i uprawnień.",
    available: [
      { icon: CalendarCheck2, title: "Baza wydarzeń", text: "Porządkuj terminy, lokalizacje, grupy zawodowe i informacje o punktach." },
      { icon: UsersRound, title: "Dane uczestników", text: "Obsługuj listy uczestników i statusy związane z konkretnym wydarzeniem." },
      { icon: FileCheck2, title: "Dokumentacja", text: "Przygotuj proces obsługi zaświadczeń, certyfikatów i wymaganych załączników." },
      { icon: FolderOpen, title: "Publikacja w Bazie szkoleń", text: "Prezentuj wydarzenia użytkownikom planującym kolejne aktywności edukacyjne." },
    ],
    roadmapTitle: "Zakres do uzgodnienia przed wdrożeniem",
    roadmapText: "Nie każdy organizator potrzebuje tego samego. Dlatego zakres administracyjny powinien wynikać z procesu, skali i odpowiedzialności organizacji.",
    roadmap: [
      "Tworzenie i aktualizowanie wydarzeń.",
      "Listy uczestników oraz import danych.",
      "Generowanie lub dystrybucja dokumentów.",
      "Integracje, role użytkowników i zakres raportów.",
    ],
    steps: [
      { title: "Opisz proces", text: "Określ typ wydarzeń, skalę i sposób obsługi uczestników." },
      { title: "Ustal dane", text: "Wskaż informacje wymagane przy wydarzeniu, uczestniku i dokumencie." },
      { title: "Dobierz zakres", text: "Uzgodnij role, uprawnienia, raporty i ewentualne integracje." },
      { title: "Uruchom pilotaż", text: "Sprawdź rozwiązanie na wybranym typie wydarzenia lub grupie użytkowników." },
    ],
    faq: [
      ["Czy CRPE zapisuje użytkownika na szkolenie?", "Nie automatycznie. Dodanie wydarzenia do planu CPD nie oznacza zapisu u organizatora."],
      ["Czy można publikować wydarzenia w Bazie szkoleń?", "Taki zakres może być elementem rozwiązania dla organizatora i wymaga uzgodnienia sposobu administracji."],
      ["Czy CRPE generuje certyfikaty?", "Obsługa certyfikatów jest elementem planowanego zakresu i musi być dopasowana do procesu organizatora."],
      ["Czy moduł ma gotowy cennik?", "Zakres jest ustalany indywidualnie, dlatego wycena zależy od funkcji, skali i sposobu wdrożenia."],
    ],
    contactRole: "organizator",
  },
};

function SectionHeading({ eyebrow, title, text, centered = false }: { eyebrow: string; title: string; text?: string; centered?: boolean }) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.19em] text-blue-700">{eyebrow}</p>
      <h2 className="mt-2 text-[28px] font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-[38px]">{title}</h2>
      {text ? <p className="mt-3 text-[15px] leading-7 text-slate-600">{text}</p> : null}
    </div>
  );
}

export default function RoleLandingPage({ role }: Props) {
  const active = content[role];
  const Icon = active.icon;

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_10%,rgba(125,211,252,0.26),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef6fc_100%)] py-12 sm:py-16 lg:py-20">
        <div className={wrap}>
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-3 py-1.5 text-[11px] font-extrabold text-blue-800 shadow-sm">
                <Icon className="h-4 w-4" /> {active.eyebrow}
              </div>
              <h1 className="mt-5 max-w-3xl text-[38px] font-black leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-[52px] lg:text-[60px]">{active.title}</h1>
              <p className="mt-5 max-w-2xl text-[16px] leading-7 text-slate-600 sm:text-[18px] sm:leading-8">{active.lead}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ring-1 ${active.statusClass}`}>{active.status}</span>
                <Link href="/bezpieczenstwo" className="inline-flex items-center gap-2 text-sm font-extrabold text-blue-700 hover:text-blue-800">Jak chronimy dane <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {role === "medyk" ? (
                  <>
                    <Link href="/rejestracja" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] hover:bg-blue-700">Załóż konto medyka <ArrowRight className="h-4 w-4" /></Link>
                    <Link href="/narzedzia" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 hover:border-blue-200 hover:bg-blue-50">Zobacz narzędzia</Link>
                  </>
                ) : (
                  role === "placowka" ? (
                    <>
                      <Link href="/placowka" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] hover:bg-blue-700">Otwórz panel placówki <ArrowRight className="h-4 w-4" /></Link>
                      <RoleContactModal role={active.contactRole} triggerLabel="Zapytaj o pilotaż" />
                    </>
                  ) : (
                    <>
                      <RoleContactModal role={active.contactRole} triggerLabel="Ustal zakres dla organizatora" />
                      <Link href="/kontakt" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 hover:border-blue-200 hover:bg-blue-50">Przejdź do kontaktu</Link>
                    </>
                  )
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-blue-100 bg-white/90 p-5 shadow-[0_28px_75px_rgba(15,45,75,0.13)] backdrop-blur sm:p-7">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white"><Icon className="h-5 w-5" /></span>
                  <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">Ścieżka CRPE</p><p className="mt-1 text-lg font-black text-slate-950">{active.eyebrow.replace("CRPE dla ", "")}</p></div>
                </div>
                <span className={`hidden rounded-full px-3 py-1.5 text-[10px] font-extrabold ring-1 sm:inline-flex ${active.statusClass}`}>{active.status}</span>
              </div>
              <div className="mt-5 grid gap-3">
                {active.available.slice(0, 3).map(({ icon: ItemIcon, title, text }) => (
                  <div key={title} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"><ItemIcon className="h-5 w-5" /></span>
                    <div><p className="text-sm font-black text-slate-950">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${wrap} py-14 sm:py-18`}>
        <SectionHeading eyebrow="Dostępny zakres" title={active.availableTitle} text={active.availableText} centered />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {active.available.map(({ icon: ItemIcon, title, text }) => (
            <article key={title} className="crpe-interactive-card rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,45,75,0.06)]">
              <span className="crpe-card-icon flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><ItemIcon className="h-5 w-5" /></span>
              <h3 className="mt-4 text-[17px] font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-14 text-white sm:py-18">
        <div className={`${wrap} grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14`}>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-300">Zakres i odpowiedzialność</p>
            <h2 className="mt-3 text-[30px] font-black leading-[1.08] tracking-[-0.04em] sm:text-[42px]">{active.roadmapTitle}</h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-300">{active.roadmapText}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {active.roadmap.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                <p className="text-sm font-semibold leading-6 text-slate-100">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${wrap} py-14 sm:py-18`}>
        <SectionHeading eyebrow="Jak zacząć" title={role === "medyk" ? "Cztery kroki do uporządkowanej ewidencji." : "Cztery kroki do dopasowanego wdrożenia."} centered />
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {active.steps.map((step, index) => (
            <article key={step.title} className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <span className="text-[11px] font-black text-blue-600">0{index + 1}</span>
              <h3 className="mt-2 text-[17px] font-black text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f6f9fd_0%,#eef4fa_100%)] py-14 sm:py-18">
        <div className={`${wrap} grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-10`}>
          <div>
            <SectionHeading eyebrow="FAQ" title={`Najczęstsze pytania: ${active.eyebrow.replace("CRPE dla ", "")}.`} text="Najważniejsze informacje przed rozpoczęciem pracy lub rozmową o wdrożeniu." />
            <Link href="/pomoc" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-blue-700">Przejdź do centrum pomocy <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="space-y-3">
            {active.faq.map(([question, answer]) => (
              <details key={question} className="group rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-[0_10px_28px_rgba(15,45,75,0.05)]">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-slate-950">{question}<span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition group-open:rotate-45">+</span></summary>
                <p className="pb-3 pr-8 text-sm leading-6 text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={`${wrap} py-14 sm:py-18`}>
        <div className="relative overflow-hidden rounded-[28px] bg-blue-600 px-6 py-9 text-white shadow-[0_26px_70px_rgba(37,99,235,0.25)] sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-300/25 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.19em] text-blue-100">Następny krok</p>
              <h2 className="mt-2 text-[30px] font-black leading-[1.08] tracking-[-0.04em] sm:text-[42px]">{role === "medyk" ? "Załóż konto i dodaj pierwszą aktywność." : role === "placowka" ? "Ustalmy zakres pilotażu dla Twojej placówki." : "Porozmawiajmy o procesie wydarzeń i dokumentacji."}</h2>
            </div>
            {role === "medyk" ? (
              <Link href="/rejestracja" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-blue-700 shadow-lg">Załóż konto <ArrowRight className="h-4 w-4" /></Link>
            ) : (
              <RoleContactModal role={active.contactRole} triggerLabel="Umów rozmowę o zakresie" triggerClassName="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-blue-700 shadow-lg transition hover:bg-blue-50" />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
