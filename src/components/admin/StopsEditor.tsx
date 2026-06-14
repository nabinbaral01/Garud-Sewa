"use client";

import { useState } from "react";
import { Plus, GripVertical, X, ArrowUp, ArrowDown } from "lucide-react";
import { parseStops, type Stop } from "@/lib/stops";

export default function StopsEditor({
  name,
  defaultValue,
  placeNames,
}: {
  name: string;
  defaultValue?: string | null;
  placeNames: string[];
}) {
  const [stops, setStops] = useState<Stop[]>(() => {
    const parsed = parseStops(defaultValue);
    return parsed.length ? parsed : [{ name: "", fare: 0, time: "" }];
  });

  const update = (i: number, patch: Partial<Stop>) =>
    setStops((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const add = () => setStops((s) => [...s, { name: "", fare: 0, time: "" }]);
  const remove = (i: number) => setStops((s) => s.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setStops((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const value = JSON.stringify(
    stops.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), fare: Number(r.fare) || 0, time: r.time || "" }))
  );

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <datalist id="place-names">
        {placeNames.map((p) => <option key={p} value={p} />)}
      </datalist>

      <p className="mb-2 text-xs text-[var(--muted)]">
        List stops in travel order, with <b>fare = cumulative price from the origin</b> (so fares must increase down
        the list). Include the origin (fare 0) and destination, or leave them out and they&apos;re added automatically
        from the trip&apos;s From/To. The <b>time</b> is when the Hiace reaches that stop (boarding/arrival time). Example:
        Birtamod 0 (6:30) → Ilam 600 (10:00) → Taplejung 1500 (3:00 PM).
      </p>

      <div className="space-y-2">
        {stops.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <GripVertical size={14} className="shrink-0 text-[var(--muted)]" />
            <span className="w-5 shrink-0 text-center text-xs text-[var(--muted)]">{i + 1}</span>
            <input
              list="place-names"
              value={row.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder={i === 0 ? "Origin (e.g. Birtamod)" : "Stop name"}
              className="gs-input !py-1.5 text-sm"
            />
            <div className="flex w-32 shrink-0 items-center gap-1">
              <span className="text-xs text-[var(--muted)]">रू</span>
              <input
                type="number"
                value={row.fare}
                onChange={(e) => update(i, { fare: Number(e.target.value) })}
                placeholder="Fare"
                className="gs-input !py-1.5 text-sm"
              />
            </div>
            <input
              type="time"
              value={row.time || ""}
              onChange={(e) => update(i, { time: e.target.value })}
              title="Time the Hiace reaches this stop"
              className="gs-input !w-28 shrink-0 !py-1.5 text-sm"
            />
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} className="text-[var(--muted)] hover:text-[var(--ink)]" aria-label="Up"><ArrowUp size={14} /></button>
              <button type="button" onClick={() => move(i, 1)} className="text-[var(--muted)] hover:text-[var(--ink)]" aria-label="Down"><ArrowDown size={14} /></button>
              <button type="button" onClick={() => remove(i)} className="text-rose-600 hover:text-rose-700" aria-label="Remove"><X size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={add} className="gs-btn gs-btn-ghost mt-2 !py-1.5 text-sm">
        <Plus size={14} /> Add stop
      </button>
    </div>
  );
}
