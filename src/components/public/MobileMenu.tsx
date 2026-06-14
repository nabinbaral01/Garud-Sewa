"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, Bus, BedDouble, Car, Plane, Palmtree, Mountain, Info, HelpCircle, FileText, LogIn } from "lucide-react";

const SERVICES = [
  { label: "Hiace", icon: <Bus size={16} />, href: "/buses" },
  { label: "Hotels", icon: <BedDouble size={16} />, href: "/hotels" },
  { label: "Book Hiace", icon: <Car size={16} />, href: "/vehicles" },
  { label: "Flights", icon: <Plane size={16} />, soon: true },
  { label: "Tours", icon: <Palmtree size={16} />, soon: true },
  { label: "Trekking", icon: <Mountain size={16} />, soon: true },
];

const PAGES = [
  { label: "About", icon: <Info size={16} />, href: "/about" },
  { label: "Help", icon: <HelpCircle size={16} />, href: "/help" },
  { label: "Terms", icon: <FileText size={16} />, href: "/terms" },
  { label: "Login", icon: <LogIn size={16} />, href: "/account" },
];

export default function MobileMenu({ light = false }: { light?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="gs-btn gs-btn-ghost h-9 w-9 !p-0"
      >
        {open ? <X size={16} /> : <Menu size={16} />}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(15rem,88vw)] overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-xl">
          <div className="px-3 pb-1 pt-3 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--muted)]">
            Services
          </div>
          {SERVICES.map((s) =>
            s.soon ? (
              <div key={s.label} className="flex cursor-default items-center justify-between px-3 py-2 text-sm text-[var(--muted)]">
                <span className="flex items-center gap-2.5"><span className="text-gsviolet">{s.icon}</span>{s.label}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-semibold text-amber-700">Soon</span>
              </div>
            ) : (
              <Link key={s.label} href={s.href!} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-indigo-50">
                <span className="text-gsviolet">{s.icon}</span>{s.label}
              </Link>
            )
          )}
          <div className="my-1 border-t border-[var(--border)]" />
          {PAGES.map((p) => (
            <Link key={p.label} href={p.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-indigo-50">
              <span className="text-gsviolet">{p.icon}</span>{p.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
