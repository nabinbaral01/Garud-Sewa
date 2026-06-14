"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, RotateCcw } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";
import BookingStatusForm from "@/components/admin/BookingStatusForm";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import {
  softDeleteBooking,
  restoreBooking,
  purgeBooking,
  bulkBinBookings,
  bulkRestoreBookings,
  bulkPurgeBookings,
} from "@/app/admin/actions";

export type BookingRow = {
  id: string;
  ref: string;
  service: string;
  detail: string;
  vehicle?: string;
  customer: string;
  phone: string;
  amount: string;
  status: string;
  date: string;
};

const BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  COMPLETED: "bg-slate-200 text-slate-700",
};

export default function BookingsTable({
  rows,
  bin,
  isSuperAdmin,
}: {
  rows: BookingRow[];
  bin: boolean;
  isSuperAdmin: boolean;
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

  const ids = [...selected].join(",");

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gsviolet bg-indigo-50/50 px-4 py-2">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            {bin ? (
              <>
                <form action={bulkRestoreBookings}>
                  <input type="hidden" name="ids" value={ids} />
                  <button className="gs-btn gs-btn-ghost text-sm"><RotateCcw size={15} /> Restore</button>
                </form>
                {isSuperAdmin && (
                  <form action={bulkPurgeBookings}>
                    <input type="hidden" name="ids" value={ids} />
                    <ConfirmSubmit title="Purge bookings" message={`Permanently delete ${selected.size} booking(s)? This cannot be undone.`} cta="Purge" className="gs-btn bg-[#e11d48] text-sm text-white">
                      <Trash2 size={15} /> Purge
                    </ConfirmSubmit>
                  </form>
                )}
              </>
            ) : (
              <form action={bulkBinBookings}>
                <input type="hidden" name="ids" value={ids} />
                <ConfirmSubmit title="Move to recycle bin" message={`Move ${selected.size} booking(s) to the recycle bin?`} cta="Move to recycle bin" className="gs-btn bg-[#e11d48] text-sm text-white">
                  <Trash2 size={15} /> Move to recycle bin
                </ConfirmSubmit>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="gs-card overflow-x-auto p-2">
        <table className="gs-table">
          <thead>
            <tr>
              <th className="w-8"><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all" /></th>
              <th>Ref</th><th>Service</th><th>Customer</th><th>Detail</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className={selected.has(b.id) ? "bg-indigo-50/40" : ""}>
                <td><input type="checkbox" checked={selected.has(b.id)} onChange={() => toggle(b.id)} aria-label="Select" /></td>
                <td className="font-mono text-xs">
                  <Link href={`/admin/bookings/${b.id}`} className="text-gsviolet hover:underline">{b.ref}</Link>
                </td>
                <td><span className="gs-chip">{b.service}</span></td>
                <td>
                  <div className="font-medium">{b.customer}</div>
                  <div className="text-xs text-[var(--muted)]">{b.phone}</div>
                </td>
                <td className="text-xs text-[var(--muted)]">
                  <div>{b.detail}</div>
                  {b.vehicle && <div className="text-[0.7rem]">🚐 {b.vehicle}</div>}
                </td>
                <td>{b.amount}</td>
                <td><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE[b.status] || ""}`}>{b.status}</span></td>
                <td className="text-xs text-[var(--muted)]">{b.date}</td>
                <td>
                  {bin ? (
                    <div className="flex items-center gap-3">
                      <form action={restoreBooking}><input type="hidden" name="id" value={b.id} /><button className="inline-flex items-center gap-1 text-sm text-emerald-600"><RotateCcw size={14} /> Restore</button></form>
                      {isSuperAdmin && <DeleteButton action={purgeBooking} id={b.id} label="Purge" confirmText="Permanently delete this booking?" />}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <BookingStatusForm id={b.id} status={b.status} variant="inline" />
                      <DeleteButton action={softDeleteBooking} id={b.id} label="Bin" confirmText="Move to recycle bin?" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-[var(--muted)]">No bookings</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
