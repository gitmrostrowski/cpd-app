// components/ui/crpe.tsx
// Wspólny język wizualny CRPE v6.28 — „punkty = kropki”.
// Te elementy są bazą dla strony głównej i kolejnych podstron publicznych.
import type { ComponentType, CSSProperties, ReactNode, SVGProps } from "react";

type IconType = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number | string }>;

export function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

/* ── Przyciski: pigułki ─────────────────────────────────────────────────── */

const pillBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

export const pill = {
  /** Jedyny kolor CTA w aplikacji. */
  primary: `${pillBase} bg-crpe-brand text-white shadow-crpe-cta hover:bg-crpe-brand-hover focus-visible:ring-crpe-brand`,
  secondary: `${pillBase} border border-crpe-line bg-white text-crpe-ink hover:border-crpe-brand-border hover:text-crpe-brand focus-visible:ring-crpe-brand`,
  /** Na granatowym tle. */
  onDark: `${pillBase} bg-white text-crpe-brand shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)] hover:bg-crpe-brand-soft focus-visible:ring-white focus-visible:ring-offset-crpe-navy`,
  ghostOnDark: `${pillBase} border border-white/25 text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-crpe-navy`,
};

/* ── Etykieta sekcji: kropka + zwykły zapis zdania ───────────────────────── */

export function Eyebrow({
  children,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p
      className={cx(
        "inline-flex items-center gap-2 text-[14px] font-bold",
        tone === "dark" ? "text-crpe-punkt-soft" : "text-crpe-punkt-text",
        className,
      )}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-crpe-punkt" aria-hidden="true" />
      {children}
    </p>
  );
}

/* ── Nagłówek z morską kropką na końcu ────────────────────────────────────── */

/** Jeśli tytuł kończy się kropką, rysuje ją w kolorze „punktu”. Treść się nie zmienia. */
export function DotTitle({ children }: { children: string }) {
  if (!children.endsWith(".")) return <>{children}</>;
  return (
    <>
      {children.slice(0, -1)}
      <span className="crpe-dot">.</span>
    </>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  centered = false,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  text?: string;
  centered?: boolean;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className={centered ? "mx-auto max-w-[720px] text-center" : "max-w-[620px]"}>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2
        className={cx(
          "mt-3 text-[30px] font-bold leading-[1.08] tracking-[-0.025em] sm:text-[40px]",
          dark ? "text-white" : "text-crpe-ink",
        )}
      >
        <DotTitle>{title}</DotTitle>
      </h2>
      {text ? (
        <p
          className={cx(
            "mt-4 text-[16px] leading-7 sm:text-[17px]",
            centered && "mx-auto max-w-[62ch]",
            dark ? "text-white/72" : "text-crpe-muted",
          )}
        >
          {text}
        </p>
      ) : null}
    </div>
  );
}

/* ── Ikona w okrągłej plakietce z „punktem” ───────────────────────────────── */

const badgeSize = {
  sm: { box: "h-10 w-10", icon: "h-[18px] w-[18px]", dot: "h-2 w-2 right-0 top-0" },
  md: { box: "h-12 w-12", icon: "h-[22px] w-[22px]", dot: "h-2.5 w-2.5 right-0 top-0" },
  lg: { box: "h-[72px] w-[72px]", icon: "h-8 w-8", dot: "h-3 w-3 right-1 top-1" },
};

const badgeTone = {
  soft: "bg-crpe-ice text-crpe-navy",
  white: "bg-white text-crpe-navy shadow-crpe-soft ring-1 ring-crpe-line",
  punkt: "bg-crpe-punkt-soft text-crpe-punkt-text",
  brand: "bg-crpe-brand-soft text-crpe-brand",
  dark: "bg-white/10 text-white ring-1 ring-white/15",
};

export function IconBadge({
  icon: Icon,
  size = "md",
  tone = "soft",
  dot = true,
  className = "",
}: {
  icon: IconType;
  size?: keyof typeof badgeSize;
  tone?: keyof typeof badgeTone;
  dot?: boolean;
  className?: string;
}) {
  const s = badgeSize[size];
  return (
    <span
      className={cx(
        "crpe-card-icon flex shrink-0 items-center justify-center rounded-full",
        className.includes("absolute") ? "" : "relative",
        s.box,
        badgeTone[tone],
        className,
      )}
      aria-hidden="true"
    >
      <Icon className={s.icon} strokeWidth={1.8} />
      {dot ? (
        <span className={cx("absolute rounded-full bg-crpe-punkt ring-2 ring-white", s.dot)} />
      ) : null}
    </span>
  );
}

/* ── Punktor listy: mała morska kropka ────────────────────────────────────── */

export function DotBullet({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span
      className={cx(
        "mt-[7px] flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full",
        tone === "dark" ? "bg-crpe-punkt/30" : "bg-crpe-punkt-soft",
      )}
      aria-hidden="true"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-crpe-punkt" />
    </span>
  );
}

/* ── Pierścień postępu z kropek ───────────────────────────────────────────── */

/**
 * Dekoracyjny pierścień: kropkowany tor + morski łuk postępu.
 * `progress` w zakresie 0–1; `milestones` to kropki-kamienie milowe na torze.
 */
export function DotRing({
  progress = 0,
  milestones = [],
  className = "",
}: {
  progress?: number;
  milestones?: number[];
  className?: string;
}) {
  const size = 600;
  const c = size / 2;
  const r = 284;
  const length = 2 * Math.PI * r;
  const offset = length * (1 - progress);
  const point = (t: number) => {
    const a = t * 2 * Math.PI - Math.PI / 2;
    return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
  };
  const end = point(progress);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden="true" fill="none">
      <circle
        cx={c}
        cy={c}
        r={r}
        stroke="var(--color-crpe-navy)"
        strokeOpacity="0.22"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="0 13"
      />
      {progress > 0 ? (
        <>
          <circle
            cx={c}
            cy={c}
            r={r}
            transform={`rotate(-90 ${c} ${c})`}
            stroke="var(--color-crpe-punkt)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={length}
            className="crpe-ring-progress"
            style={
              {
                strokeDashoffset: offset,
                "--ring-length": `${length}`,
                "--ring-offset": `${offset}`,
              } as CSSProperties
            }
          />
          <circle cx={end.x} cy={end.y} r="12" fill="#fff" stroke="var(--color-crpe-punkt)" strokeWidth="5" />
        </>
      ) : null}
      {milestones.map((t) => {
        const p = point(t);
        return <circle key={t} cx={p.x} cy={p.y} r="8" fill="var(--color-crpe-punkt)" stroke="#fff" strokeWidth="4" />;
      })}
      <circle cx={point(0).x} cy={point(0).y} r="7" fill="var(--color-crpe-navy)" />
    </svg>
  );
}

/* ── Dekoracyjna kropkowana krzywa (sekcje granatowe) ─────────────────────── */

export function DottedCurve({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 140" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 118C70 118 92 40 170 40s96 70 160 70 70-60 86-84"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="0 10"
      />
      <circle cx="170" cy="40" r="6" fill="var(--color-crpe-punkt)" />
      <circle cx="330" cy="110" r="6" fill="currentColor" />
      <circle cx="416" cy="26" r="6" fill="var(--color-crpe-punkt)" />
    </svg>
  );
}
