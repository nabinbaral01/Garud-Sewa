"use client";

import { useState } from "react";
import { UploadCloud, X } from "lucide-react";

// Uploads an image and stores its MediaAsset id in a hidden input (so it can be
// used directly as coverImageId / logoId / imageId on a form).
export default function MediaUploadField({
  name,
  label,
  defaultId,
  defaultUrl,
}: {
  name: string;
  label: string;
  defaultId?: string | null;
  defaultUrl?: string | null;
}) {
  const [id, setId] = useState(defaultId ?? "");
  const [url, setUrl] = useState(defaultUrl ?? "");
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
      setId(data.id);
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
      <label className="gs-label">{label}</label>
      <input type="hidden" name={name} value={id} />
      <div className="flex items-center gap-3">
        {url ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-16 w-16 rounded-lg border border-[var(--border)] object-cover" />
            <button
              type="button"
              onClick={() => {
                setId("");
                setUrl("");
              }}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white"
              aria-label="Remove"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-[0.6rem] text-[var(--muted)]">
            none
          </div>
        )}
        <label className="gs-btn gs-btn-ghost cursor-pointer text-sm">
          <UploadCloud size={15} /> {busy ? "Uploading…" : url ? "Replace" : "Upload image"}
          <input type="file" accept="image/*" hidden onChange={onChange} disabled={busy} />
        </label>
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
