"use client";

import { useState } from "react";
import { UploadCloud, X } from "lucide-react";

export default function SettingImageUpload({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Upload failed");
      const data = await res.json();
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      {/* saveSettings reads this */}
      <input type="hidden" name={name} value={url} />
      <div className="flex items-start gap-3">
        {url ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="QR" className="h-28 w-28 rounded-lg border border-[var(--border)] object-contain" />
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white"
              aria-label="Remove"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-center text-[0.65rem] text-[var(--muted)]">
            No QR yet
          </div>
        )}
        <div>
          <label className="gs-btn gs-btn-primary cursor-pointer text-sm">
            <UploadCloud size={15} /> {busy ? "Uploading…" : "Upload QR image"}
            <input type="file" accept="image/*" hidden onChange={onChange} disabled={busy} />
          </label>
          <p className="mt-1 text-xs text-[var(--muted)]">Upload your FonePay QR — it shows at checkout.</p>
          {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
