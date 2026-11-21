"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CircleAlert, Home, RotateCw } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // El error queda en la consola del navegador para diagnóstico; no se
    // muestra el detalle técnico al usuario.
    console.error("Error no controlado en la interfaz", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border border-slate-700/60 bg-slate-800 px-6 py-12 text-center shadow-xl">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300">
          <CircleAlert className="size-7" aria-hidden="true" />
        </span>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">
            Error inesperado
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            Algo salió mal.
          </h1>
          <p className="text-sm leading-6 text-slate-400">
            No pudimos completar la operación. Puedes reintentar o volver al
            inicio.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
          >
            <RotateCw className="size-4" aria-hidden="true" />
            Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Home className="size-4" aria-hidden="true" />
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
