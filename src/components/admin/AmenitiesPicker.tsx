"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";

export default function AmenitiesPicker({
  name,
  defaultValue = "",
  suggestions,
}: {
  name: string;
  defaultValue?: string;
  suggestions: string[];
}) {
  const initial = defaultValue
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // chips = suggestions plus any custom values already saved (dedup, keep order)
  const [chips, setChips] = useState<string[]>(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of [...suggestions, ...initial]) {
      const k = v.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(v);
      }
    }
    return out;
  });
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));
  const [custom, setCustom] = useState("");

  const toggle = (v: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  const addCustom = () => {
    const v = custom.trim();
    if (!v) return;
    if (!chips.some((c) => c.toLowerCase() === v.toLowerCase())) setChips((c) => [...c, v]);
    setSelected((prev) => new Set(prev).add(v));
    setCustom("");
  };

  const removeChip = (v: string) => {
    setChips((c) => c.filter((x) => x !== v));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(v);
      return next;
    });
  };

  // ordered csv based on chip order
  const value = chips.filter((c) => selected.has(c)).join(",");

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const on = selected.has(c);
          return (
            <span
              key={c}
              className={`inline-flex items-center gap-1.5 rounded-full border py-1.5 pl-3 pr-1.5 text-sm transition ${
                on
                  ? "gs-gradient border-transparent text-white"
                  : "border-[var(--border)] bg-white text-[var(--ink)]"
              }`}
            >
              <button type="button" onClick={() => toggle(c)} className="inline-flex items-center gap-1.5">
                {on && <Check size={14} />}
                {c}
              </button>
              <button
                type="button"
                onClick={() => removeChip(c)}
                aria-label={`Remove ${c}`}
                title="Remove"
                className={`flex h-4 w-4 items-center justify-center rounded-full ${
                  on ? "hover:bg-white/25" : "text-[var(--muted)] hover:bg-rose-100 hover:text-rose-600"
                }`}
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add custom amenity…"
          className="gs-input !py-1.5 text-sm"
        />
        <button type="button" onClick={addCustom} className="gs-btn gs-btn-ghost !py-1.5 text-sm whitespace-nowrap">
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}
