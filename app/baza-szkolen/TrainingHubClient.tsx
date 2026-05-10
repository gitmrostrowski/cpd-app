const chooseTraining = async (t: Training) => {
  if (!user) {
    alert("Zaloguj się, żeby dodać szkolenie do planu.");
    return;
  }

  const year = t.start_date
    ? Number(t.start_date.slice(0, 4))
    : new Date().getFullYear();

  const payload: ActivityInsert = {
    user_id: user.id,
    type: mapToActivityType(t.category, t.format),
    points: typeof t.points === "number" ? t.points : 0,
    year,
    organizer: t.organizer ?? null,

    status: "planned",
    planned_start_date: t.start_date ?? null,
    training_id: t.id,

    certificate_path: null,
    certificate_name: null,
    certificate_mime: null,
    certificate_size: null,
    certificate_uploaded_at: null,
  };

  const { error } = await supabase.from("activities").insert(payload);

  if (error) {
    alert(`Nie udało się dodać szkolenia do planu: ${error.message}`);
    return;
  }

  if (t.url) {
    const goToOrganizer = window.confirm(
      "Dodano do planu CPD.\n\nTo nie oznacza zapisu u organizatora. Aby wziąć udział w szkoleniu, musisz zapisać się bezpośrednio na stronie organizatora.\n\nCzy chcesz teraz przejść do strony organizatora?"
    );

    if (goToOrganizer) {
      window.open(t.url, "_blank", "noopener,noreferrer");
    }

    return;
  }

  alert(
    "Dodano do planu CPD.\n\nTo nie oznacza zapisu u organizatora. Aby wziąć udział w szkoleniu, musisz zapisać się bezpośrednio u organizatora."
  );
};
