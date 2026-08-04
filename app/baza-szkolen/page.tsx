// app/baza-szkolen/page.tsx
import TrainingHubClient from "./TrainingHubClient";

export const metadata = {
  title: "Szkolenia medyczne z punktami edukacyjnymi — baza CRPE",
  description:
    "Wyszukaj kursy, konferencje i webinary dla zawodów medycznych. Filtruj według punktów edukacyjnych, zawodu, terminu, miejsca i formy szkolenia.",
  alternates: {
    canonical: "/baza-szkolen",
  },
};

export default function Page() {
  return <TrainingHubClient />;
}
