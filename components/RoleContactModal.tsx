"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Mail, UserRound, X } from "lucide-react";

type ContactRole = "placowka" | "organizator" | "ogolne";

type Props = {
  role?: ContactRole;
  triggerLabel?: string;
  triggerClassName?: string;
  compact?: boolean;
};

const roleCopy: Record<ContactRole, {
  title: string;
  eyebrow: string;
  description: string;
  subject: string;
  icon: typeof Building2;
  questions: string[];
}> = {
  placowka: {
    title: "Zapytaj o CRPE dla placówki",
    eyebrow: "Moduł organizacyjny",
    description: "Opisz wielkość zespołu i najważniejszy problem. Przygotujemy rozmowę wokół realnego zakresu wdrożenia.",
    subject: "CRPE dla placówki / jednostki",
    icon: Building2,
    questions: ["Liczba pracowników", "Sposób prowadzenia ewidencji dziś", "Najważniejszy oczekiwany efekt"],
  },
  organizator: {
    title: "Porozmawiajmy o zakresie dla organizatora",
    eyebrow: "Obsługa wydarzeń",
    description: "Podaj skalę wydarzeń, liczbę uczestników i najważniejsze potrzeby związane z dokumentacją.",
    subject: "CRPE dla organizatora kształcenia",
    icon: UserRound,
    questions: ["Liczba wydarzeń rocznie", "Orientacyjna liczba uczestników", "Potrzebne funkcje"],
  },
  ogolne: {
    title: "Skontaktuj się z CRPE",
    eyebrow: "Kontakt",
    description: "Napisz krótko, czego potrzebujesz. Przygotujemy odpowiedź dopasowaną do Twojej sytuacji.",
    subject: "Pytanie dotyczące CRPE",
    icon: Mail,
    questions: ["Twoja rola", "Temat pytania", "Najważniejsze informacje"],
  },
};

export default function RoleContactModal({
  role = "ogolne",
  triggerLabel = "Napisz do nas",
  triggerClassName = "",
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [email, setEmail] = useState("");
  const [scale, setScale] = useState("");
  const [message, setMessage] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const copy = useMemo(() => roleCopy[role], [role]);
  const Icon = copy.icon;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = [
      `Imię i nazwisko: ${name || "—"}`,
      `Organizacja / placówka: ${organisation || "—"}`,
      `E-mail: ${email || "—"}`,
      `Skala / liczba osób lub wydarzeń: ${scale || "—"}`,
      "",
      "Wiadomość:",
      message || "—",
    ].join("\n");

    window.location.href = `mailto:kontakt@crpe.pl?subject=${encodeURIComponent(copy.subject)}&body=${encodeURIComponent(body)}`;
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName || "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(37,99,235,0.2)] transition hover:-translate-y-0.5 hover:bg-blue-700"}
      >
        {triggerLabel}
        {!compact ? <ArrowRight className="h-4 w-4" /> : null}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] border border-white/70 bg-white shadow-[0_35px_110px_rgba(15,23,42,0.32)] sm:max-w-[680px] sm:rounded-[28px]">
            <div className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_85%_0%,rgba(125,211,252,0.28),transparent_42%),linear-gradient(135deg,#eff6ff_0%,#ffffff_70%)] px-5 py-6 sm:px-7 sm:py-7">
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-600 transition hover:bg-white hover:text-slate-950"
                aria-label="Zamknij formularz"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-start gap-4 pr-12">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)]">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">{copy.eyebrow}</p>
                  <h2 id="contact-modal-title" className="mt-1.5 text-[23px] font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-[28px]">
                    {copy.title}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{copy.description}</p>
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="grid gap-5 p-5 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                  Imię i nazwisko
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3.5 font-medium outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    autoComplete="name"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                  E-mail
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3.5 font-medium outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    autoComplete="email"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                  Organizacja / placówka
                  <input
                    value={organisation}
                    onChange={(event) => setOrganisation(event.target.value)}
                    className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3.5 font-medium outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    autoComplete="organization"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                  Skala
                  <input
                    value={scale}
                    onChange={(event) => setScale(event.target.value)}
                    placeholder={role === "organizator" ? "np. 30 wydarzeń rocznie" : "np. 45 pracowników"}
                    className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3.5 font-medium outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-blue-700">Warto dopisać</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {copy.questions.map((item) => (
                    <span key={item} className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {item}
                    </span>
                  ))}
                </div>
              </div>

              <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                Czego potrzebujesz?
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  rows={5}
                  className="resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-medium leading-6 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-xs leading-5 text-slate-500">
                  Po kliknięciu przygotujemy wiadomość w Twoim programie pocztowym. Formularz nie zapisuje danych w serwisie.
                </p>
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(37,99,235,0.2)] transition hover:bg-blue-700"
                >
                  Przygotuj wiadomość <Mail className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
