import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border border-slate-700/60 bg-slate-800 px-6 py-12 text-center shadow-xl">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
          <Search className="size-7" aria-hidden="true" />
        </span>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Error 404
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            No encontramos esta página.
          </h1>
          <p className="text-sm leading-6 text-slate-400">
            Puede que el enlace haya cambiado o que la página ya no exista.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
        >
          <Home className="size-4" aria-hidden="true" />
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
