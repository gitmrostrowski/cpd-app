import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 md:pt-16">
      {/* górna fala */}
      <div className="pointer-events-none absolute right-[-20%] top-[-10%] h-[40rem] w-[60rem] rounded-[9999px] bg-indigo-200/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 md:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
            Centralny Rejestr Punktów Edukacyjnych
            <br />
            <span className="text-indigo-600">To Proste!</span>
          </h1>

          <p className="max-w-prose text-lg text-slate-600">
            Buduj, zapisuj i utrzymuj dokładny rejestr swojego rozwoju zawodowego.
            W jednym miejscu — szybko i intuicyjnie.
          </p>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-white shadow hover:bg-indigo-700"
            >
              <span>Join Now</span> <span>↗</span>
            </Link>
            <Link
              href="/kalkulator"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 hover:bg-black/5"
            >
              Zobacz kalkulator
            </Link>
          </div>
        </div>

        {/* ilustracja po prawej (wrzuć własny plik do /public) */}
        <div className="relative">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-[520px]">
            <Image
              src="/illustration.svg"
              alt="CPD illustration"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* pas z kolorem jak u CPDme */}
      <div className="mt-14 bg-indigo-50/80 py-12">
        <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* lewa karta z nagłówkiem */}
          <div className="rounded-2xl bg-white p-8 shadow-sm border">
            <h2 className="text-2xl font-semibold">CPD Portfolio Building</h2>
            <p className="mt-3 text-slate-600">
              Zaufany przez tysiące specjalistów. Łatwo dodawaj aktywności,
              licz punkty i generuj raporty.
            </p>
          </div>

          {/* miejsce na wideo lub obraz */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border">
            <div className="aspect-video w-full rounded-xl border grid place-items-center text-slate-400">
              {/* Podmień iframe z YouTube / wideo kiedy będziesz gotowy */}
              Wideo / demo
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
