import Link from "next/link";

export default function BottomCTA() {
  return (
    <section className="bg-indigo-600 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Gotowy, by zacząć?</h3>
          <p className="text-indigo-100">Załóż konto i zacznij porządkować swoje CPD.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="rounded-xl bg-white px-5 py-3 text-indigo-700 font-medium shadow hover:bg-indigo-50">
            Join Now
          </Link>
          <Link href="/raporty" className="rounded-xl ring-1 ring-white/60 px-5 py-3 hover:bg-white/10">
            Zobacz raporty
          </Link>
        </div>
      </div>
    </section>
  );
}
