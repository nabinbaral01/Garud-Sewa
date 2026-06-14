"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Settings2 } from "lucide-react";
import { EditLink } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { bulkDelete } from "@/app/admin/actions";
import { npr } from "@/lib/format";

export type Col = { key: string; label: string; kind?: "text" | "chip" | "money" };
export type Row = Record<string, string | number | null> & { id: string };

export default function BulkTable({
  rows,
  columns,
  model,
  editBase,
  singleDelete,
  labelKey,
  manageBase,
  manageLabel = "Manage",
}: {
  rows: Row[];
  columns: Col[];
  model: string;
  editBase: string; // e.g. "/admin/operators?edit="
  singleDelete: (fd: FormData) => void;
  labelKey?: string; // field used in delete confirm text
  manageBase?: string; // optional extra link, e.g. "/admin/hotels/"
  manageLabel?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allChecked = rows.length > 0 && selected.size === rows.length;

  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const cell = (row: Row, col: Col) => {
    const v = row[col.key];
    if (v === null || v === undefined || v === "") return <span className="text-[var(--muted)]">—</span>;
    if (col.kind === "chip") return <span className="gs-chip">{String(v)}</span>;
    if (col.kind === "money") return npr(Number(v));
    return String(v);
  };

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-gsviolet bg-indigo-50/50 px-4 py-2">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <form action={bulkDelete}>
            <input type="hidden" name="model" value={model} />
            <input type="hidden" name="ids" value={[...selected].join(",")} />
            <ConfirmSubmit
              title="Delete selected"
              message={`Delete ${selected.size} selected item(s)? Items still in use will be skipped.`}
              cta="Delete selected"
              className="gs-btn bg-[#e11d48] text-sm text-white"
            >
              <Trash2 size={15} /> Delete selected
            </ConfirmSubmit>
          </form>
        </div>
      )}

      <div className="gs-card overflow-x-auto p-2">
        <table className="gs-table">
          <thead>
            <tr>
              <th className="w-8">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all" />
              </th>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={selected.has(row.id) ? "bg-indigo-50/40" : ""}>
                <td>
                  <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} aria-label="Select row" />
                </td>
                {columns.map((c, i) => (
                  <td key={c.key} className={i === 0 ? "font-medium" : ""}>{cell(row, c)}</td>
                ))}
                <td className="text-right">
                  <div className="flex justify-end gap-3">
                    {manageBase && (
                      <Link href={`${manageBase}${row.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-gsblue hover:underline">
                        <Settings2 size={14} /> {manageLabel}
                      </Link>
                    )}
                    <EditLink href={`${editBase}${row.id}`} />
                    <DeleteButton action={singleDelete} id={row.id} confirmText={`Delete "${labelKey ? row[labelKey] : "this item"}"?`} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 2} className="py-6 text-center text-[var(--muted)]">Nothing here yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
