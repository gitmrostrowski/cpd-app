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
  /* v6.30: płaski nagłówek w systemie Home v15 – bez karty, paska i plam światła.
     Kolor akcentu zostaje tylko w kaflu ikony, żeby moduły dało się odróżnić. */
  const bubbleTone =
    accent === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : accent === "emerald"
        ? "border-crpe-success-border bg-crpe-success-soft text-crpe-success"
        : "border-crpe-brand-border bg-crpe-brand-soft text-crpe-brand";

  return (
    <header className="border-b border-crpe-line pb-6 pt-2 sm:pb-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          {icon ? (
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border [&_svg]:h-7 [&_svg]:w-7 [&_svg]:stroke-[1.75] ${bubbleTone}`}
            >
              {icon}
            </span>
          ) : null}

          <div className="min-w-0">
            <p className="text-[14px] font-medium text-crpe-subtle">
              {eyebrow}
            </p>
            <h1 className="mt-0.5 text-[28px] font-black leading-[1.12] text-crpe-ink sm:text-[32px]">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-crpe-muted">
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
                    ? "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-crpe-line bg-white px-5 text-[15px] font-semibold text-crpe-ink transition hover:border-crpe-subtle"
                    : "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-crpe-brand px-5 text-[15px] font-semibold text-white transition hover:bg-crpe-brand-hover"
                }
              >
                {action.icon}
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  );
}
