"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, X } from "lucide-react";
import { addBusImage, removeBusImage } from "@/app/admin/actions";

type Img = { id: string; url: string };

export default function BusGallery({ busId, images }: { busId: string; images: Img[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files.length) return;
    setBusy(true);
    setError("");
    try {
      let order = images.length;
      for (const file of Array.from(files)) {
        const up = new FormData();
        up.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: up });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Upload failed");
        const media = await res.json();
        const fd = new FormData();
        fd.append("busId", busId);
        fd.append("mediaId", media.id);
        fd.append("sortOrder", String(order++));
        await addBusImage(fd);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function remove(id: string) {
    const fd = new FormData();
    fd.append("id", id);
    await removeBusImage(fd);
    router.refresh();
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {images.map((im) => (
          <div key={im.id} className="relative overflow-hidden rounded-lg border border-[var(--border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.url} alt="" className="h-24 w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(im.id)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white"
              aria-label="Remove"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {images.length === 0 && <p className="col-span-full text-sm text-[var(--muted)]">No photos yet.</p>}
      </div>
      <label className="gs-btn gs-btn-primary mt-3 cursor-pointer text-sm">
        <UploadCloud size={15} /> {busy ? "Uploading…" : "Upload interior / exterior photos"}
        <input type="file" accept="image/*" multiple hidden onChange={onChange} disabled={busy} />
      </label>
      {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
