import {
  LayoutDashboard,
  ListTodo,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/auth/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const navItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ROLE_USER", "ROLE_MODERATOR", "ROLE_ADMIN"],
  },
  {
    href: "/tasks",
    label: "Tareas",
    icon: ListTodo,
    roles: ["ROLE_USER", "ROLE_MODERATOR", "ROLE_ADMIN"],
  },
  {
    href: "/users",
    label: "Usuarios",
    icon: Users,
    roles: ["ROLE_ADMIN"],
  },
];

export function getVisibleNavItems(role: UserRole | undefined): NavItem[] {
  if (!role) {
    return [];
  }
  return navItems.filter((item) => item.roles.includes(role));
}

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getSectionTitle(pathname: string): string {
  if (pathname === "/") {
    return "Dashboard";
  }
  const match = navItems.find(
    (item) => item.href !== "/" && isActivePath(pathname, item.href),
  );
  return match?.label ?? "TaskFlow";
}
