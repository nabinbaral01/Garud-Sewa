"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

export type PlaceOption = { id: string; nameEn: string; nameNe: string; district: string };

export default function PlaceAutocomplete({
  name,
  placeholder,
  options,
  defaultValue = "",
  icon,
  value,
  onValueChange,
}: {
  name: string;
  placeholder: string;
  options: PlaceOption[];
  defaultValue?: string;
  icon?: React.ReactNode;
  value?: string;
  onValueChange?: (v: string) => void;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const query = controlled ? value : internal;
  const setQuery = (v: string) => (controlled ? onValueChange?.(v) : setInternal(v));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter(
        (o) =>
          o.nameEn.toLowerCase().includes(q) ||
          o.nameNe.includes(query.trim()) ||
          o.district.toLowerCase().includes(q)
      )
    : options;

  function choose(o: PlaceOption) {
    setQuery(o.nameEn);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2">
        <span className="text-gsviolet">{icon ?? <MapPin size={16} />}</span>
        <input
          className="gs-input bare"
          autoComplete="off"
          name={name}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, filtered.length - 1));
            else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            else if (e.key === "Enter" && open && filtered[active]) {
              e.preventDefault();
              choose(filtered[active]);
            }
          }}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full max-h-72 overflow-auto rounded-lg border border-[var(--border)] bg-white shadow-lg">
          {filtered.map((o, i) => (
            <li
              key={o.id}
              className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                i === active ? "bg-indigo-50" : ""
              }`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(o);
              }}
            >
              <span>
                {o.nameEn} <span className="text-[var(--muted)]">· {o.nameNe}</span>
              </span>
              <span className="text-xs text-[var(--muted)]">{o.district}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
