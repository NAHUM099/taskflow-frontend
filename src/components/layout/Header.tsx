"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { getSectionTitle } from "@/lib/navigation";

interface HeaderProps {
  onOpenMobile: () => void;
}

export function Header({ onOpenMobile }: HeaderProps) {
  const pathname = usePathname();
  const title = getSectionTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-700/60 bg-slate-900/80 px-4 backdrop-blur-sm sm:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Abrir menú"
        className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="flex min-w-0 flex-col">
        <nav aria-label="Miga de pan" className="hidden sm:block">
          <span className="text-xs text-slate-500">TaskFlow</span>
          <span className="mx-1.5 text-xs text-slate-600" aria-hidden="true">
            /
          </span>
          <span className="text-xs text-slate-400">{title}</span>
        </nav>
        <h1 className="truncate text-base font-semibold tracking-tight text-slate-100 sm:text-lg">
          {title}
        </h1>
      </div>

      {/* Espacio reservado para acciones contextuales futuras */}
    </header>
  );
}
