import { prisma } from "@/lib/db";
import { upsertBanner, deleteBanner } from "@/app/admin/actions";
import { AdminHeader, Field, EditLink, FormCard } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import MediaUploadField from "@/components/admin/MediaUploadField";

export default async function BannersAdmin({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const editing = edit !== undefined;
  const rec = edit && edit !== "new" ? await prisma.banner.findUnique({ where: { id: edit }, include: { image: true } }) : null;
  const banners = await prisma.banner.findMany({ include: { image: true }, orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <AdminHeader title="Banners & promos" subtitle="Homepage slider and promotions" addHref="/admin/banners?edit=new" addLabel="Add banner" editing={editing} />
      {editing && (
        <FormCard>
          <h2 className="mb-3 font-bold">{rec ? "Edit banner" : "New banner"}</h2>
          <form action={upsertBanner} className="grid gap-3 sm:grid-cols-2">
            {rec && <input type="hidden" name="id" value={rec.id} />}
            <Field label="Title *"><input name="title" required defaultValue={rec?.title} className="gs-input" /></Field>
            <Field label="Subtitle"><input name="subtitle" defaultValue={rec?.subtitle ?? ""} className="gs-input" /></Field>
            <MediaUploadField name="imageId" label="Image" defaultId={rec?.imageId} defaultUrl={rec?.image?.url} />
            <Field label="Link URL"><input name="link" defaultValue={rec?.link ?? ""} className="gs-input" placeholder="/buses?from=..." /></Field>
            <Field label="Promo code"><input name="promoCode" defaultValue={rec?.promoCode ?? ""} className="gs-input" /></Field>
            <Field label="Sort order"><input name="sortOrder" type="number" defaultValue={rec?.sortOrder ?? 0} className="gs-input" /></Field>
            <Field label="Active"><label className="flex items-center gap-2 pt-2"><input type="checkbox" name="active" defaultChecked={rec?.active ?? true} /> Visible on homepage</label></Field>
            <div className="sm:col-span-2"><button className="gs-btn gs-btn-primary">{rec ? "Save changes" : "Create banner"}</button></div>
          </form>
        </FormCard>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((b) => (
          <div key={b.id} className="gs-card overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {b.image && <img src={b.image.url} alt={b.title} className="h-32 w-full object-cover" />}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">{b.title}</h3>
                  <p className="text-sm text-[var(--muted)]">{b.subtitle}</p>
                </div>
                <span className={`text-xs ${b.active ? "text-emerald-600" : "text-rose-600"}`}>{b.active ? "Active" : "Hidden"}</span>
              </div>
              {b.promoCode && <span className="gs-chip mt-2">Code: {b.promoCode}</span>}
              <div className="mt-3 flex gap-3"><EditLink href={`/admin/banners?edit=${b.id}`} /><DeleteButton action={deleteBanner} id={b.id} confirmText={`Delete "${b.title}"?`} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
