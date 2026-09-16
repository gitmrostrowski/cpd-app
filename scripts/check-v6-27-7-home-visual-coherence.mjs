import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const chart = fs.readFileSync(path.join(root, "app/panel-cpd/CalculatorClient.tsx"), "utf8");
const training = fs.readFileSync(path.join(root, "app/baza-szkolen/TrainingHubClient.tsx"), "utf8");

import "./check-v6-28-punkty-visual-system.mjs";

// Dziedziczymy funkcjonalność z v6.27.5/v6.27.6 bez zmian Panelu CPD i Bazy szkoleń.
for (const token of ["bg-crpe-brand", "bg-crpe-warning-soft", "bg-crpe-success-soft", "bg-crpe-danger-soft"]) {
  if (!chart.includes(token)) throw new Error(`v6.27.7: regresja tokenów Panelu CPD: ${token}`);
}
if (!training.includes("border-crpe-brand-border bg-white") || training.includes("border-indigo-200 bg-indigo-50")) {
  throw new Error("v6.27.7: regresja systemu kolorów Bazy szkoleń.");
}

console.log("OK — aktualny Home oraz zachowane kolory Panelu CPD i Bazy szkoleń");
