"use client";

import { useRef, useState } from "react";
import { X, QrCode, UploadCloud, Check } from "lucide-react";

export type PaymentInfo = {
  qr: string;
  merchant: string;
  terminal: string;
  branch: string;
};

export default function PaymentConfirm({
  label,
  payment,
  className = "gs-btn gs-btn-primary",
}: {
  label: string;
  payment: PaymentInfo;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [proof, setProof] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);

  async function onProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-proof", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Upload failed");
      setProof((await res.json()).url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  const pay = () => {
    const form = btnRef.current?.form;
    setOpen(false);
    form?.requestSubmit();
  };

  return (
    <>
      <input type="hidden" name="paymentProof" value={proof} />
      <button ref={btnRef} type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-bold text-gsviolet">
                <QrCode size={16} /> Scan me to pay
              </span>
              <button type="button" onClick={() => setOpen(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-[var(--border)] p-3">
              <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--muted)]">We accept FonePay</div>
              {payment.qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={payment.qr} alt="Payment QR" className="mx-auto mt-2 h-52 w-52 object-contain" />
              ) : (
                <div className="mx-auto mt-2 flex h-52 w-52 items-center justify-center rounded-lg bg-[var(--bg)] text-xs text-[var(--muted)]">
                  QR not set — add it in Admin → Settings → Payment
                </div>
              )}
              <div className="mt-2 text-sm font-semibold">{payment.merchant}</div>
              {payment.terminal && <div className="text-xs text-[var(--muted)]">Terminal: {payment.terminal}</div>}
              {payment.branch && <div className="text-xs text-[var(--muted)]">Bank Branch: {payment.branch}</div>}
            </div>

            <p className="mt-3 text-xs text-[var(--muted)]">Scan with any mobile banking / wallet, then upload your payment screenshot and tap “I have paid”.</p>

            {/* payment proof */}
            <div className="mt-3 rounded-lg border border-dashed border-[var(--border)] p-3 text-left">
              {proof ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600"><Check size={15} /> Proof uploaded</span>
                  <button type="button" onClick={() => setProof("")} className="text-xs text-rose-600 hover:underline">Remove</button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gsviolet">
                  <UploadCloud size={16} /> {busy ? "Uploading…" : "Upload payment screenshot"}
                  <input type="file" accept="image/*" hidden onChange={onProof} disabled={busy} />
                </label>
              )}
              {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
            </div>

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="gs-btn gs-btn-ghost flex-1 text-sm">
                Cancel
              </button>
              <button type="button" onClick={pay} className="gs-btn gs-btn-primary flex-1 text-sm">
                I have paid
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
