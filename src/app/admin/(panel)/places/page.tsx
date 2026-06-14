import { prisma } from "@/lib/db";
import { upsertPlace } from "@/app/admin/actions";
import { AdminHeader, Field, FormCard, Notice } from "@/components/admin/ui";
import PlacesTable from "@/components/admin/PlacesTable";

const DISTRICTS = ["Jhapa", "Ilam", "Panchthar", "Taplejung"];
const TYPES = ["city", "bus_park", "airport", "hotel_area", "temple"];

export default async function PlacesAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string; deleted?: string }> }) {
  const { edit, error, deleted } = await searchParams;
  const editing = edit !== undefined;
  const rec = edit && edit !== "new" ? await prisma.place.findUnique({ where: { id: edit } }) : null;
  const places = await prisma.place.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <AdminHeader title="Places" subtitle={`${places.length} places along the corridor`} addHref="/admin/places?edit=new" addLabel="Add place" editing={editing} />
      {error === "inuse" && (
        <Notice kind="error">Some places couldn&apos;t be deleted — they&apos;re still used by a Hiace, hotel, vehicle or route. Reassign those first.</Notice>
      )}
      {deleted && <Notice kind="success">Selected places deleted.</Notice>}
      {!editing && (
        <p className="mb-4 text-sm text-[var(--muted)]">
          Order = position along the corridor (top = toward Jhapa, bottom = toward Taplejung). Use the ↑/↓ arrows to keep
          towns in real travel order — this drives segment fares and seat-collision detection for every Hiace.
        </p>
      )}

      {editing && (
        <FormCard>
          <h2 className="mb-3 font-bold">{rec ? "Edit place" : "New place"}</h2>
          <form action={upsertPlace} className="grid gap-3 sm:grid-cols-2">
            {rec && <input type="hidden" name="id" value={rec.id} />}
            <Field label="Name (English) *"><input name="nameEn" required defaultValue={rec?.nameEn} className="gs-input" /></Field>
            <Field label="Name (Nepali) *"><input name="nameNe" required defaultValue={rec?.nameNe} className="gs-input" /></Field>
            <Field label="District">
              <select name="district" defaultValue={rec?.district ?? "Jhapa"} className="gs-input">
                {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select name="type" defaultValue={rec?.type ?? "city"} className="gs-input">
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Latitude"><input name="lat" type="number" step="any" defaultValue={rec?.lat ?? ""} className="gs-input" /></Field>
            <Field label="Longitude"><input name="lng" type="number" step="any" defaultValue={rec?.lng ?? ""} className="gs-input" /></Field>
            <Field label="Sort order"><input name="sortOrder" type="number" defaultValue={rec?.sortOrder ?? 0} className="gs-input" /></Field>
            <div className="sm:col-span-2"><button className="gs-btn gs-btn-primary">{rec ? "Save changes" : "Create place"}</button></div>
          </form>
        </FormCard>
      )}

      <PlacesTable
        places={places.map((p) => ({
          id: p.id,
          nameEn: p.nameEn,
          nameNe: p.nameNe,
          district: p.district,
          type: p.type,
          lat: p.lat,
          lng: p.lng,
        }))}
      />
    </div>
  );
}
