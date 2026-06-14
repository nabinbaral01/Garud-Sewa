"use client";

import { useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

// A submit button that opens a styled confirmation modal, then submits its
// parent <form> (server action) when confirmed. Replaces window.confirm().
export default function ConfirmSubmit({
  className,
  children,
  title = "Are you sure?",
  message,
  cta = "Delete",
  danger = true,
}: {
  className?: string;
  children: React.ReactNode;
  title?: string;
  message: string;
  cta?: string;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const go = () => {
    const form = btnRef.current?.form;
    setOpen(false);
    form?.requestSubmit();
  };

  return (
    <>
      <button ref={btnRef} type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${danger ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-gsviolet"}`}>
                  <AlertTriangle size={18} />
                </span>
                <h3 className="text-lg font-bold">{title}</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="gs-btn gs-btn-ghost text-sm">Cancel</button>
              <button
                type="button"
                onClick={go}
                className={`gs-btn text-sm ${danger ? "text-white" : "gs-btn-primary"}`}
                style={danger ? { background: "#e11d48" } : undefined}
              >
                {cta}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
