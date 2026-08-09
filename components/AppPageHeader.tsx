import Link from "next/link";
import type { ReactNode } from "react";

export type AppPageHeaderAction = {
  label: string;
  href: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary";
};

/**
 * Wspólny nagłówek ekranów po zalogowaniu.
 *
 * Wcześniej każdy ekran miał własny: Panel CPD kartę z gradientem, Baza szkoleń
 * kartę z bursztynowym paskiem, a Aktywności i Profil goły `h1` w innej wadze
 * i rozmiarze. Przejście między nimi wyglądało jak przejście między aplikacjami.
 */
export default function AppPageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions = [],
  actionsSlot,
  accent = "blue",
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: AppPageHeaderAction[];
  /** Dla akcji, które nie są linkami (np. przycisk otwierający modal). */
  actionsSlot?: ReactNode;
  /** Pasek koloru po lewej — pozwala odróżnić moduły bez zmiany układu. */
  accent?: "blue" | "amber" | "emerald";
  children?: ReactNode;
}) {
  const accentBar =
    accent === "amber"
      ? "bg-amber-400"
      : accent === "emerald"
        ? "bg-emerald-500"
        : "bg-blue-600";

  const bubbleTone =
    accent === "amber"
      ? "border-amber-100 bg-amber-50 text-amber-700"
      : accent === "emerald"
        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
        : "border-blue-100 bg-blue-50 text-blue-700";

  return (
    <header className="relative overflow-hidden rounded-[24px] border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/80 px-5 py-5 shadow-[0_18px_48px_rgba(15,45,75,0.08)] sm:px-6 sm:py-6">
      <span
        className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${accentBar}`}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5">
          {icon ? (
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${bubbleTone}`}
            >
              {icon}
            </span>
          ) : null}

          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-[28px] font-black tracking-[-0.035em] text-slate-950 sm:text-[32px]">
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actionsSlot ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
            {actionsSlot}
          </div>
        ) : null}

        {actions.length ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
            {actions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={
                  action.variant === "secondary"
                    ? "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                    : "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 active:scale-95"
                }
              >
                {action.icon}
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {children ? <div className="relative mt-4">{children}</div> : null}
    </header>
  );
}
