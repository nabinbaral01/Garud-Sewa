import { prisma } from "@/lib/db";
import { addMediaByUrl, deleteMedia } from "@/app/admin/actions";
import { Field } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import MediaUploader from "@/components/admin/MediaUploader";

export default async function MediaAdmin() {
  const media = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Media library</h1>
          <p className="text-sm text-[var(--muted)]">{media.length} images · used across listings & banners</p>
        </div>
        <MediaUploader />
      </div>

      <form action={addMediaByUrl} className="gs-card mb-6 grid gap-3 p-4 sm:grid-cols-3">
        <Field label="…or add image by URL"><input name="url" placeholder="https://…" className="gs-input" /></Field>
        <Field label="Alt text"><input name="alt" className="gs-input" /></Field>
        <div className="flex items-end"><button className="gs-btn gs-btn-ghost">Add URL</button></div>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {media.map((m) => (
          <div key={m.id} className="gs-card overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.alt} className="h-32 w-full object-cover" />
            <div className="flex items-center justify-between p-2">
              <span className="truncate text-xs text-[var(--muted)]" title={m.filename}>{m.filename}</span>
              <DeleteButton action={deleteMedia} id={m.id} iconOnly confirmText="Delete this image? Listings using it will lose it." />
            </div>
          </div>
        ))}
        {media.length === 0 && <p className="col-span-full text-sm text-[var(--muted)]">No media yet. Upload some images.</p>}
      </div>
    </div>
  );
}
