"use client";

import { useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { updateBookingStatus } from "@/app/admin/actions";
import { Field } from "@/components/admin/ui";

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

const CONFIRM: Record<string, { title: string; msg: string; danger?: boolean; cta: string }> = {
  CONFIRMED: { title: "Confirm booking", msg: "The customer's seats / room will be reserved.", cta: "Confirm booking" },
  CANCELLED: { title: "Cancel booking", msg: "This will release the seats / room for this booking.", danger: true, cta: "Cancel booking" },
  COMPLETED: { title: "Complete booking", msg: "Mark this booking as completed?", cta: "Mark completed" },
  PENDING: { title: "Set to pending", msg: "Set this booking back to pending?", cta: "Set pending" },
};

export default function BookingStatusForm({
  id,
  status,
  notes,
  variant = "full",
}: {
  id: string;
  status: string;
  notes?: string | null;
  variant?: "full" | "inline";
}) {
  const [value, setValue] = useState(status);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const bypass = useRef(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (bypass.current) {
      bypass.current = false;
      return; // confirmed — allow the server action to run
    }
    if (value !== status) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const doSubmit = () => {
    setOpen(false);
    bypass.current = true;
    formRef.current?.requestSubmit();
  };

  const conf = CONFIRM[value] || { title: "Update booking", msg: `Change status to ${value}?`, cta: "Update" };

  const modal = open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${conf.danger ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-gsviolet"}`}>
              <AlertTriangle size={18} />
            </span>
            <h3 className="text-lg font-bold">{conf.title}</h3>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
            <X size={18} />
          </button>
        </div>
        <p className="mt-3 text-sm text-[var(--muted)]">{conf.msg}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="gs-btn gs-btn-ghost text-sm">Keep as is</button>
          <button
            type="button"
            onClick={doSubmit}
            className={`gs-btn text-sm ${conf.danger ? "text-white" : "gs-btn-primary"}`}
            style={conf.danger ? { background: "#e11d48" } : undefined}
          >
            {conf.cta}
          </button>
        </div>
      </div>
    </div>
  );

  if (variant === "inline") {
    return (
      <>
        <form action={updateBookingStatus} onSubmit={onSubmit} ref={formRef} className="flex items-center gap-1">
          <input type="hidden" name="id" value={id} />
          <select name="status" value={value} onChange={(e) => setValue(e.target.value)} className="gs-input !py-1 text-xs">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="gs-btn gs-btn-ghost !px-2 !py-1 text-xs">Save</button>
        </form>
        {modal}
      </>
    );
  }

  return (
    <>
      <form action={updateBookingStatus} onSubmit={onSubmit} ref={formRef} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={id} />
        <Field label="Status">
          <select name="status" value={value} onChange={(e) => setValue(e.target.value)} className="gs-input">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Notes (internal)">
          <input name="notes" defaultValue={notes ?? ""} className="gs-input" placeholder="Add a note…" />
        </Field>
        <div className="sm:col-span-2">
          <button className="gs-btn gs-btn-primary">Save changes</button>
        </div>
      </form>
      {modal}
    </>
  );
}
