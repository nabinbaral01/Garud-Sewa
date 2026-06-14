"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Route,
  Building2,
  Bus,
  Hotel,
  Car,
  CalendarCheck,
  CalendarDays,
  Users,
  Image as ImageIcon,
  Megaphone,
  Ticket,
  Settings,
  UserCog,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/places", label: "Places", icon: MapPin },
  { href: "/admin/routes", label: "Routes", icon: Route },
  { href: "/admin/operators", label: "Operators", icon: Building2 },
  { href: "/admin/buses", label: "Hiace", icon: Bus },
  { href: "/admin/hotels", label: "Hotels", icon: Hotel },
  { href: "/admin/vehicles", label: "Book Hiace", icon: Car },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/schedule", label: "Daily schedule", icon: CalendarDays },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/banners", label: "Banners", icon: Megaphone },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/staff", label: "Staff", icon: UserCog, super: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, super: true },
];

export default function AdminShell({
  name,
  role,
  children,
}: {
  name: string;
  role: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const nav = (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-slate-900 p-3 text-white">
      <div className="mb-4 flex items-center justify-between px-2 py-2">
        <Link href="/" className="flex items-center gap-2" onClick={close}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg gs-gradient">
            <Bus size={16} />
          </span>
          <span className="font-extrabold">Garud Sewa</span>
        </Link>
        <button onClick={close} className="text-slate-400 hover:text-white lg:hidden" aria-label="Close menu">
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {NAV.filter((i) => !i.super || role === "SUPER_ADMIN").map((i) => {
          const active = i.exact ? path === i.href : path.startsWith(i.href);
          const Icon = i.icon;
          return (
            <Link key={i.href} href={i.href} onClick={close} className={`admin-link ${active ? "active" : ""}`}>
              <Icon size={16} /> {i.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-3 border-t border-white/10 pt-3">
        <div className="px-2 text-xs text-slate-400">
          {name} · <span className="uppercase">{role === "SUPER_ADMIN" ? "Super" : "Editor"}</span>
        </div>
        <form action={logoutAction}>
          <button className="admin-link mt-1 w-full text-left">
            <LogOut size={16} /> Logout
          </button>
        </form>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* desktop sidebar */}
      <div className="hidden lg:block">{nav}</div>

      {/* mobile drawer */}
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={close} />}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </div>

      {/* main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--border)] bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="text-[var(--ink)]">
            <Menu size={22} />
          </button>
          <span className="font-extrabold gs-text-gradient">Garud Sewa</span>
        </header>
        <main className="min-w-0 flex-1 overflow-x-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
