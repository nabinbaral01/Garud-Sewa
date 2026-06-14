import { prisma } from "@/lib/db";

export default async function MediaSelect({
  name,
  defaultValue,
  label = "Image",
}: {
  name: string;
  defaultValue?: string | null;
  label?: string;
}) {
  const media = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <label className="gs-label">{label}</label>
      <select name={name} defaultValue={defaultValue ?? ""} className="gs-input">
        <option value="">— none —</option>
        {media.map((m) => (
          <option key={m.id} value={m.id}>
            {m.filename} {m.alt ? `(${m.alt})` : ""}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-[var(--muted)]">Upload images in the Media library first.</p>
    </div>
  );
}
