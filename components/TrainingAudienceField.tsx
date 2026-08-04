import type { ProfessionOption } from "@/lib/cpd/professions";

export const GENERAL_TRAINING_AUDIENCE = "Wszyscy medycy";

type Props = {
  value: string | null | undefined;
  onChange: (value: string) => void;
  options: readonly ProfessionOption[];
  disabled?: boolean;
  error?: string | null;
  compact?: boolean;
};

function selectedAudiences(value: string | null | undefined) {
  const parts = String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.some((item) => /wszys|og[oó]l/i.test(item))) {
    return [GENERAL_TRAINING_AUDIENCE];
  }

  return parts;
}

export function hasTrainingAudience(value: string | null | undefined) {
  return selectedAudiences(value).length > 0;
}

export function trainingAudienceSummary(value: string | null | undefined) {
  const selected = selectedAudiences(value);
  if (!selected.length) return "Nie wskazano";
  if (selected[0] === GENERAL_TRAINING_AUDIENCE) return GENERAL_TRAINING_AUDIENCE;
  if (selected.length === 1) return selected[0];
  return `${selected[0]} +${selected.length - 1}`;
}

export default function TrainingAudienceField({
  value,
  onChange,
  options,
  disabled = false,
  error,
  compact = false,
}: Props) {
  const selected = selectedAudiences(value);
  const isGeneral = selected.includes(GENERAL_TRAINING_AUDIENCE);
  const knownNames = new Set(options.map((option) => option.name_pl));
  const availableNames = [
    ...options.map((option) => option.name_pl),
    ...selected.filter(
      (name) => name !== GENERAL_TRAINING_AUDIENCE && !knownNames.has(name),
    ),
  ];

  function toggleProfession(name: string, checked: boolean) {
    const next = new Set(
      selected.filter((item) => item !== GENERAL_TRAINING_AUDIENCE),
    );
    if (checked) next.add(name);
    else next.delete(name);
    onChange(Array.from(next).join(", "));
  }

  return (
    <fieldset
      className={`rounded-xl border bg-white ${
        error ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200"
      } ${compact ? "p-3" : "p-4"}`}
      aria-describedby={error ? "training-audience-error" : undefined}
    >
      <legend className="px-1 text-xs font-semibold text-slate-700">
        Adresaci szkolenia <span className="text-rose-600">*</span>
      </legend>
      <p className="mb-3 text-xs leading-5 text-slate-500">
        Wybierz wszystkich medyków albo jedną lub kilka grup zawodowych.
      </p>

      <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-900 ring-1 ring-blue-100">
        <input
          type="checkbox"
          checked={isGeneral}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.checked ? GENERAL_TRAINING_AUDIENCE : "")
          }
          className="mt-0.5 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-200"
        />
        <span>
          {GENERAL_TRAINING_AUDIENCE}
          <span className="mt-0.5 block text-xs font-normal text-blue-700">
            Szkolenie nie jest ograniczone do konkretnego zawodu.
          </span>
        </span>
      </label>

      <div
        className={`mt-3 grid gap-2 ${
          compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {availableNames.map((name) => (
          <label
            key={name}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              selected.includes(name)
                ? "border-blue-200 bg-blue-50 text-blue-800"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
            } ${isGeneral ? "cursor-not-allowed opacity-45" : ""}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(name)}
              disabled={disabled || isGeneral}
              onChange={(event) => toggleProfession(name, event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
            />
            <span>{name}</span>
          </label>
        ))}
      </div>

      {error ? (
        <p
          id="training-audience-error"
          role="alert"
          className="mt-3 text-xs font-semibold text-rose-700"
        >
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
