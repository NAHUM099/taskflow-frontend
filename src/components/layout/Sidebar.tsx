"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getVisibleNavItems, isActivePath } from "@/lib/navigation";
import { ROLE_LABELS } from "@/lib/auth/types";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface SidebarContentProps {
  variant: "desktop" | "mobile";
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Sidebar de escritorio */}
      <aside
        className={`sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-slate-700/60 bg-slate-900 transition-[width] duration-200 ease-in-out lg:flex ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <SidebarContent
          variant="desktop"
          collapsed={collapsed}
          onToggleCollapsed={onToggleCollapsed}
          onCloseMobile={onCloseMobile}
        />
      </aside>

      {/* Overlay del drawer móvil */}
      <button
        type="button"
        aria-label="Cerrar menú"
        inert={!mobileOpen}
        onClick={onCloseMobile}
        className={`fixed inset-0 z-40 cursor-default bg-slate-950/60 transition-opacity duration-200 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer móvil */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        inert={!mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85%] flex-col border-r border-slate-700/60 bg-slate-900 shadow-xl transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          variant="mobile"
          collapsed={false}
          onToggleCollapsed={onToggleCollapsed}
          onCloseMobile={onCloseMobile}
        />
      </div>
    </>
  );
}

function SidebarContent({
  variant,
  collapsed,
  onToggleCollapsed,
  onCloseMobile,
}: SidebarContentProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const showCloseButton = variant === "mobile";
  const showCollapseToggle = variant === "desktop";
  const visibleItems = getVisibleNavItems(user?.role);

  return (
    <>
      <div
        className={`flex h-16 shrink-0 items-center gap-3 border-b border-slate-700/60 px-4 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 shadow-sm shadow-indigo-600/30">
          <Check
            className="size-4 text-white"
            strokeWidth={3}
            aria-hidden="true"
          />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold tracking-tight text-slate-100">
            TaskFlow
          </span>
        )}
        {showCloseButton && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
            className="ml-auto flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 p-3"
        aria-label="Navegación principal"
      >
        {visibleItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                active
                  ? "bg-indigo-500/10 text-slate-100"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon
                className={`size-5 shrink-0 ${active ? "text-indigo-400" : ""}`}
                aria-hidden="true"
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {collapsed && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-slate-700/60 p-3">
        <UserMenu collapsed={collapsed} />
        {showCollapseToggle && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={
              collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"
            }
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5 shrink-0" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-5 shrink-0" aria-hidden="true" />
            )}
            {!collapsed && <span>Colapsar</span>}
          </button>
        )}
      </div>
    </>
  );
}

function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const email = user?.email ?? "";
  const initial = (email.charAt(0) || "?").toUpperCase();
  const roleLabel = user ? ROLE_LABELS[user.role] : "";

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={collapsed ? `${email}, ${roleLabel}` : undefined}
        className={`group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-300">
          {initial}
        </span>
        {!collapsed && (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-slate-100">
                {email}
              </span>
              <span className="truncate text-xs text-slate-500">
                {roleLabel}
              </span>
            </span>
            <ChevronsUpDown
              className="size-4 shrink-0 text-slate-500"
              aria-hidden="true"
            />
          </>
        )}
        {collapsed && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            {email}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menú de usuario"
          className={`absolute z-50 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl ${
            collapsed
              ? "bottom-0 left-full ml-2 w-48"
              : "bottom-full left-0 mb-2 w-full"
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700/60 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
          >
            <User className="size-4" aria-hidden="true" />
            Mi perfil
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700/60 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}


