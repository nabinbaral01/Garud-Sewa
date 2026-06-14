import { prisma } from "@/lib/db";
import { upsertOperator, deleteOperator } from "@/app/admin/actions";
import { AdminHeader, Field, FormCard, Notice } from "@/components/admin/ui";
import MediaUploadField from "@/components/admin/MediaUploadField";
import BulkTable from "@/components/admin/BulkTable";

export default async function OperatorsAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string; deleted?: string }> }) {
  const { edit, error, deleted } = await searchParams;
  const editing = edit !== undefined;
  const rec = edit && edit !== "new" ? await prisma.operator.findUnique({ where: { id: edit }, include: { logo: true } }) : null;
  const ops = await prisma.operator.findMany({ include: { logo: true, _count: { select: { buses: true } } } });

  return (
    <div>
      <AdminHeader title="Hiace operators" addHref="/admin/operators?edit=new" addLabel="Add operator" editing={editing} />
      {error === "inuse" && <Notice kind="error">Some operators couldn&apos;t be deleted — they still have Hiace trips.</Notice>}
      {deleted && <Notice kind="success">Selected operators deleted.</Notice>}
      {editing && (
        <FormCard>
          <h2 className="mb-3 font-bold">{rec ? "Edit operator" : "New operator"}</h2>
          <form action={upsertOperator} className="grid gap-3 sm:grid-cols-2">
            {rec && <input type="hidden" name="id" value={rec.id} />}
            <Field label="Name *"><input name="name" required defaultValue={rec?.name} className="gs-input" /></Field>
            <Field label="Contact"><input name="contact" defaultValue={rec?.contact ?? ""} className="gs-input" /></Field>
            <Field label="Rating"><input name="rating" type="number" step="0.1" min="0" max="5" defaultValue={rec?.rating ?? 4} className="gs-input" /></Field>
            <MediaUploadField name="logoId" label="Logo" defaultId={rec?.logoId} defaultUrl={rec?.logo?.url} />
            <div className="sm:col-span-2"><button className="gs-btn gs-btn-primary">{rec ? "Save changes" : "Create operator"}</button></div>
          </form>
        </FormCard>
      )}
      <BulkTable
        model="operator"
        editBase="/admin/operators?edit="
        singleDelete={deleteOperator}
        labelKey="name"
        columns={[
          { key: "name", label: "Operator" },
          { key: "contact", label: "Contact" },
          { key: "rating", label: "Rating" },
          { key: "buses", label: "Hiace" },
        ]}
        rows={ops.map((o) => ({
          id: o.id,
          name: o.name,
          contact: o.contact,
          rating: `${o.rating.toFixed(1)} ★`,
          buses: o._count.buses,
        }))}
      />
    </div>
  );
}
