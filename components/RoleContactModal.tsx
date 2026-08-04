"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  LoaderCircle,
  Mail,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

type ContactRole = "medyk" | "placowka" | "organizator";

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
  recipient: string;
  icon: typeof Building2;
  questions: string[];
  organisationLabel?: string;
  scaleLabel?: string;
  scalePlaceholder?: string;
}> = {
  medyk: {
    title: "Napisz do pomocy CRPE",
    eyebrow: "Kontakt dla medyka",
    description: "Opisz pytanie lub problem. Wiadomość wyślemy bezpośrednio do zespołu pomocy CRPE.",
    recipient: "pomoc@crpe.pl",
    icon: Stethoscope,
    questions: ["Czego dotyczy pytanie", "Na którym kroku pojawił się problem", "Jaki komunikat widzisz"],
  },
  placowka: {
    title: "Zapytaj o CRPE dla placówki",
    eyebrow: "Moduł organizacyjny",
    description: "Opisz wielkość zespołu i najważniejszy problem. Przygotujemy rozmowę wokół realnego zakresu wdrożenia.",
    recipient: "kontakt@crpe.pl",
    icon: Building2,
    questions: ["Liczba pracowników", "Sposób prowadzenia ewidencji dziś", "Najważniejszy oczekiwany efekt"],
    organisationLabel: "Nazwa placówki / jednostki",
    scaleLabel: "Wielkość zespołu",
    scalePlaceholder: "np. 45 pracowników",
  },
  organizator: {
    title: "Porozmawiajmy o zakresie dla organizatora",
    eyebrow: "Obsługa wydarzeń",
    description: "Podaj skalę wydarzeń, liczbę uczestników i najważniejsze potrzeby związane z dokumentacją.",
    recipient: "zgloszenia@crpe.pl",
    icon: UserRound,
    questions: ["Liczba wydarzeń rocznie", "Orientacyjna liczba uczestników", "Potrzebne funkcje"],
    organisationLabel: "Nazwa organizatora",
    scaleLabel: "Skala działalności",
    scalePlaceholder: "np. 30 wydarzeń rocznie",
  },
};

const errorMessages: Record<string, string> = {
  invalid_request: "Sprawdź poprawność pól i spróbuj ponownie.",
  rate_limited: "Wysłano już kilka wiadomości. Spróbuj ponownie za godzinę lub napisz bezpośrednio na podany adres.",
  contact_unavailable: "Formularz jest chwilowo niedostępny. Skorzystaj z bezpośredniego adresu e-mail.",
  delivery_failed: "Nie udało się przekazać wiadomości. Skorzystaj z bezpośredniego adresu e-mail.",
};

export default function RoleContactModal({
  role = "medyk",
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
  const [website, setWebsite] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [fallbackCopied, setFallbackCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const copy = useMemo(() => roleCopy[role], [role]);
  const Icon = copy.icon;

  function openModal() {
    setError("");
    setReference("");
    setConfirmationSent(false);
    setFallbackCopied(false);
    setStartedAt(Date.now());
    setOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, submitting]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name,
          email,
          organisation: role === "medyk" ? undefined : organisation,
          scale: role === "medyk" ? undefined : scale,
          message,
          website,
          startedAt,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        reference?: string;
        confirmation_sent?: boolean;
      };

      if (!response.ok) {
        throw new Error(payload.error || "delivery_failed");
      }

      setReference(payload.reference || "CRPE");
      setConfirmationSent(payload.confirmation_sent === true);
      setName("");
      setEmail("");
      setOrganisation("");
      setScale("");
      setMessage("");
    } catch (submitError) {
      const code = submitError instanceof Error ? submitError.message : "delivery_failed";
      setError(errorMessages[code] || errorMessages.delivery_failed);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyFallbackAddress() {
    try {
      await navigator.clipboard.writeText(copy.recipient);
      setFallbackCopied(true);
      window.setTimeout(() => setFallbackCopied(false), 2200);
    } catch {
      setFallbackCopied(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-haspopup="dialog"
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
            if (event.currentTarget === event.target) closeModal();
          }}
        >
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] border border-white/70 bg-white shadow-[0_35px_110px_rgba(15,23,42,0.32)] sm:max-w-[680px] sm:rounded-[28px]">
            <div className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_85%_0%,rgba(125,211,252,0.28),transparent_42%),linear-gradient(135deg,#eff6ff_0%,#ffffff_70%)] px-5 py-6 sm:px-7 sm:py-7">
              <button
                ref={closeRef}
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
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

            {reference ? (
              <div className="grid justify-items-center gap-5 p-7 text-center sm:p-10">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
                  <CheckCircle2 className="h-9 w-9" />
                </span>
                <div>
                  <h3 className="text-2xl font-black tracking-[-0.03em] text-slate-950">Wiadomość została przyjęta</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                    Przekazaliśmy ją do wysyłki na <strong>{copy.recipient}</strong>.
                    {confirmationSent
                      ? " Kopię z numerem zgłoszenia wysłaliśmy także na podany przez Ciebie adres e-mail."
                      : " Nie udało się wysłać kopii na Twój adres, ale zgłoszenie do zespołu CRPE zostało przyjęte."}
                  </p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Numer zgłoszenia: {reference}</p>
                </div>
                <button type="button" onClick={closeModal} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-7 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700">
                  Zamknij
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="relative grid gap-5 p-5 sm:p-7">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                    Imię i nazwisko
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      minLength={2}
                      maxLength={120}
                      disabled={submitting}
                      className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3.5 font-medium outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
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
                      maxLength={320}
                      disabled={submitting}
                      className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3.5 font-medium outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                      autoComplete="email"
                    />
                  </label>
                  {role !== "medyk" ? (
                    <>
                      <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                        {copy.organisationLabel}
                        <input
                          value={organisation}
                          onChange={(event) => setOrganisation(event.target.value)}
                          required
                          maxLength={180}
                          disabled={submitting}
                          className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3.5 font-medium outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                          autoComplete="organization"
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                        {copy.scaleLabel}
                        <input
                          value={scale}
                          onChange={(event) => setScale(event.target.value)}
                          placeholder={copy.scalePlaceholder}
                          maxLength={120}
                          disabled={submitting}
                          className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3.5 font-medium outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                        />
                      </label>
                    </>
                  ) : null}
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
                    minLength={10}
                    maxLength={5000}
                    rows={5}
                    disabled={submitting}
                    className="resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-medium leading-6 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                  />
                </label>

                <label className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                  Strona internetowa
                  <input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
                </label>

                {error ? (
                  <div role="alert" aria-live="polite" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      {error}{" "}
                      <a href={`mailto:${copy.recipient}`} className="font-extrabold underline underline-offset-2">
                        {copy.recipient}
                      </a>
                    </span>
                    <button
                      type="button"
                      onClick={copyFallbackAddress}
                      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-xs font-extrabold text-rose-700 transition hover:bg-rose-100"
                    >
                      {fallbackCopied ? (
                        <><Check className="h-4 w-4" /> Skopiowano</>
                      ) : (
                        <><Copy className="h-4 w-4" /> Kopiuj adres</>
                      )}
                    </button>
                  </div>
                ) : null}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-sm text-xs leading-5 text-slate-500">
                    Formularz wyśle wiadomość do <strong>{copy.recipient}</strong>. Dane wykorzystamy wyłącznie do obsługi kontaktu zgodnie z <Link href="/polityka-prywatnosci" className="font-bold text-blue-700 underline underline-offset-2">polityką prywatności</Link>.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(37,99,235,0.2)] transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
                  >
                    {submitting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Wysyłanie…</> : <>Wyślij wiadomość <Mail className="h-4 w-4" /></>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
