import { prisma } from "@/lib/db";
import { upsertCoupon, deleteCoupon } from "@/app/admin/actions";
import { AdminHeader, Field, FormCard, Notice } from "@/components/admin/ui";
import BulkTable from "@/components/admin/BulkTable";
import { isoDate } from "@/lib/format";

export default async function CouponsAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; deleted?: string }> }) {
  const { edit, deleted } = await searchParams;
  const editing = edit !== undefined;
  const rec = edit && edit !== "new" ? await prisma.coupon.findUnique({ where: { id: edit } }) : null;
  const coupons = await prisma.coupon.findMany();

  return (
    <div>
      <AdminHeader title="Coupons & discounts" addHref="/admin/coupons?edit=new" addLabel="Add coupon" editing={editing} />
      {deleted && <Notice kind="success">Selected coupons deleted.</Notice>}
      {editing && (
        <FormCard>
          <h2 className="mb-3 font-bold">{rec ? "Edit coupon" : "New coupon"}</h2>
          <form action={upsertCoupon} className="grid gap-3 sm:grid-cols-2">
            {rec && <input type="hidden" name="id" value={rec.id} />}
            <Field label="Code *"><input name="code" required defaultValue={rec?.code} className="gs-input uppercase" /></Field>
            <Field label="Type">
              <select name="discountType" defaultValue={rec?.discountType ?? "PERCENT"} className="gs-input">
                <option value="PERCENT">Percent (%)</option><option value="FLAT">Flat (NPR)</option>
              </select>
            </Field>
            <Field label="Value *"><input name="value" type="number" required defaultValue={rec?.value ?? 10} className="gs-input" /></Field>
            <Field label="Expires"><input name="expiresAt" type="date" defaultValue={rec?.expiresAt ? isoDate(rec.expiresAt) : ""} className="gs-input" /></Field>
            <Field label="Active"><label className="flex items-center gap-2 pt-2"><input type="checkbox" name="active" defaultChecked={rec?.active ?? true} /> Enabled</label></Field>
            <div className="sm:col-span-2"><button className="gs-btn gs-btn-primary">{rec ? "Save changes" : "Create coupon"}</button></div>
          </form>
        </FormCard>
      )}
      <BulkTable
        model="coupon"
        editBase="/admin/coupons?edit="
        singleDelete={deleteCoupon}
        labelKey="code"
        columns={[
          { key: "code", label: "Code" },
          { key: "type", label: "Type" },
          { key: "value", label: "Value" },
          { key: "expires", label: "Expires" },
          { key: "active", label: "Active" },
        ]}
        rows={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          type: c.discountType,
          value: c.discountType === "PERCENT" ? `${c.value}%` : `NPR ${c.value}`,
          expires: c.expiresAt ? isoDate(c.expiresAt) : "—",
          active: c.active ? "Yes" : "No",
        }))}
      />
    </div>
  );
}
