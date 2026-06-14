"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { addHotelImage } from "@/app/admin/actions";

export default function GalleryUploader({ hotelId, nextOrder }: { hotelId: string; nextOrder: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files.length) return;
    setBusy(true);
    setError("");
    try {
      let order = nextOrder;
      for (const file of Array.from(files)) {
        const up = new FormData();
        up.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: up });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Upload failed");
        const media = await res.json();
        const fd = new FormData();
        fd.append("hotelId", hotelId);
        fd.append("mediaId", media.id);
        fd.append("sortOrder", String(order++));
        await addHotelImage(fd);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4">
      <label className="gs-btn gs-btn-primary cursor-pointer text-sm">
        <UploadCloud size={15} /> {busy ? "Uploading…" : "Upload gallery images"}
        <input type="file" accept="image/*" multiple hidden onChange={onChange} disabled={busy} />
      </label>
      <p className="mt-1 text-xs text-[var(--muted)]">Upload one or more photos — they&apos;re added to this hotel&apos;s gallery.</p>
      {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
