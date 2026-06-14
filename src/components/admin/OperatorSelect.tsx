"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2 } from "lucide-react";

type Opt = { id: string; name: string };
const ADD = "__add__";
const MANAGE = "__manage__";

export default function OperatorSelect({
  name,
  options,
  defaultValue = "",
  required,
}: {
  name: string;
  options: Opt[];
  defaultValue?: string;
  required?: boolean;
}) {
  const router = useRouter();
  const [opts, setOpts] = useState<Opt[]>(options);
  const [value, setValue] = useState(defaultValue);
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", contact: "" });

  async function add() {
    if (!form.name.trim()) {
      setError("Enter an operator name");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed");
      const op = await res.json();
      setOpts((o) => [...o, { id: op.id, name: op.name }]);
      setValue(op.id);
      setAdding(false);
      setForm({ name: "", contact: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add operator");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this operator? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/operators?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed");
      setOpts((o) => o.filter((p) => p.id !== id));
      if (value === id) setValue("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete operator");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <select
        name={name}
        required={required}
        value={value}
        onChange={(e) => {
          if (e.target.value === ADD) {
            setAdding(true);
            setManaging(false);
          } else if (e.target.value === MANAGE) {
            setManaging(true);
            setAdding(false);
          } else {
            setValue(e.target.value);
          }
        }}
        className="gs-input"
      >
        {!value && <option value="" disabled>Choose an operator…</option>}
        {opts.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
        <option value={ADD}>➕ Add new operator…</option>
        <option value={MANAGE}>🗑️ Delete an operator…</option>
      </select>

      {adding && (
        <div className="mt-2 rounded-lg border border-dashed border-gsviolet bg-indigo-50/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gsblue">New operator</span>
            <button type="button" onClick={() => setAdding(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
              <X size={14} />
            </button>
          </div>
          <div className="grid gap-2">
            <input
              placeholder="Operator name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="gs-input !py-1.5 text-sm"
            />
            <input
              placeholder="Contact (optional)"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="gs-input !py-1.5 text-sm"
            />
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button type="button" onClick={add} disabled={busy} className="gs-btn gs-btn-primary !py-1.5 text-sm">
              <Plus size={14} /> {busy ? "Adding…" : "Add & select"}
            </button>
          </div>
        </div>
      )}

      {managing && (
        <div className="mt-2 rounded-lg border border-dashed border-rose-300 bg-rose-50/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Delete an operator</span>
            <button type="button" onClick={() => setManaging(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
              <X size={14} />
            </button>
          </div>
          {error && <p className="mb-2 text-xs text-rose-600">{error}</p>}
          <ul className="max-h-56 space-y-1 overflow-auto">
            {opts.map((o) => (
              <li key={o.id} className="flex items-center justify-between rounded bg-white px-2 py-1 text-sm">
                <span>{o.name}</span>
                <button
                  type="button"
                  onClick={() => remove(o.id)}
                  disabled={busy}
                  className="text-rose-600 hover:text-rose-700 disabled:opacity-50"
                  aria-label={`Delete ${o.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
