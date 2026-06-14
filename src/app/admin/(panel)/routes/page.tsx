import { prisma } from "@/lib/db";
import { upsertRoute, deleteRoute } from "@/app/admin/actions";
import { AdminHeader, Field, EditLink, FormCard } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function RoutesAdmin({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const editing = edit !== undefined;
  const rec = edit && edit !== "new" ? await prisma.route.findUnique({ where: { id: edit } }) : null;
  const [routes, places] = await Promise.all([
    prisma.route.findMany({ include: { from: true, to: true } }),
    prisma.place.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <AdminHeader title="Routes" subtitle="Corridor routes & distances" addHref="/admin/routes?edit=new" addLabel="Add route" editing={editing} />
      {editing && (
        <FormCard>
          <h2 className="mb-3 font-bold">{rec ? "Edit route" : "New route"}</h2>
          <form action={upsertRoute} className="grid gap-3 sm:grid-cols-2">
            {rec && <input type="hidden" name="id" value={rec.id} />}
            <Field label="From *">
              <select name="fromId" defaultValue={rec?.fromId} required className="gs-input">
                {places.map((p) => <option key={p.id} value={p.id}>{p.nameEn}</option>)}
              </select>
            </Field>
            <Field label="To *">
              <select name="toId" defaultValue={rec?.toId} required className="gs-input">
                {places.map((p) => <option key={p.id} value={p.id}>{p.nameEn}</option>)}
              </select>
            </Field>
            <Field label="Distance (km)"><input name="distanceKm" type="number" defaultValue={rec?.distanceKm ?? 0} className="gs-input" /></Field>
            <Field label="Duration (min)"><input name="durationMin" type="number" defaultValue={rec?.durationMin ?? 0} className="gs-input" /></Field>
            <Field label="Services (csv)"><input name="services" defaultValue={rec?.services ?? "BUS,VEHICLE"} className="gs-input" /></Field>
            <Field label="Active"><label className="flex items-center gap-2 pt-2"><input type="checkbox" name="active" defaultChecked={rec?.active ?? true} /> Visible</label></Field>
            <div className="sm:col-span-2"><button className="gs-btn gs-btn-primary">{rec ? "Save changes" : "Create route"}</button></div>
          </form>
        </FormCard>
      )}
      <div className="gs-card overflow-x-auto p-2">
        <table className="gs-table">
          <thead><tr><th>Route</th><th>Distance</th><th>Duration</th><th>Services</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.from.nameEn} → {r.to.nameEn}</td>
                <td>{r.distanceKm} km</td>
                <td>{Math.round(r.durationMin / 60)}h {r.durationMin % 60}m</td>
                <td className="text-xs">{r.services}</td>
                <td>{r.active ? "Yes" : "No"}</td>
                <td className="text-right"><div className="flex justify-end gap-3"><EditLink href={`/admin/routes?edit=${r.id}`} /><DeleteButton action={deleteRoute} id={r.id} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
