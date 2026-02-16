// components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t mt-10">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="opacity-70">
          © {new Date().getFullYear()} CRPE.pl
        </div>

        <div className="flex gap-4">
          <Link className="underline underline-offset-4" href="/regulamin">Regulamin</Link>
          <Link className="underline underline-offset-4" href="/polityka-prywatnosci">Polityka prywatności</Link>
        </div>
      </div>
    </footer>
  );
}
