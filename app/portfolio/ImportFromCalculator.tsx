"use client";

import { useState } from "react";
import { importFromCalculator } from "./actions";

const STORAGE_KEY = "crpe_calculator_v1";

export default function ImportFromCalculator() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function handleImport() {
    try {
      setState("loading");
      setMessage("");

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setState("error");
        setMessage("Nie znaleziono danych kalkulatora na tym urządzeniu.");
        return;
      }

      const parsed = JSON.parse(raw);
      const activities = Array.isArray(parsed?.activities) ? parsed.activities : [];

      if (!activities.length) {
        setState("error");
        setMessage("W kalkulatorze nie ma żadnych aktywności do importu.");
        return;
      }

      await importFromCalculator({ activities });

      setState("done");
      setMessage("Zaimportowano aktywności do Portfolio.");
    } catch (e: any) {
      setState("error");
      setMessage(e?.message || "Import nie powiódł się.");
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Import z kalkulatora</h2>
          <p className="mt-1 text-sm text-slate-600">
            Jeśli wcześniej liczyłeś jako gość, możesz przenieść wpisy z tego urządzenia na swoje konto.
          </p>
        </div>

        <button
          onClick={handleImport}
          disabled={state === "loading"}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {state === "loading" ? "Importuję..." : "Importuj aktywności"}
        </button>
      </div>

      {message && (
        <div
          className={`mt-3 rounded-xl border p-3 text-sm ${
            state === "done"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}

