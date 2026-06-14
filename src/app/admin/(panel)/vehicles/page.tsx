import { prisma } from "@/lib/db";
import { upsertVehicle, deleteVehicle } from "@/app/admin/actions";
import { AdminHeader, Field, FormCard, Notice } from "@/components/admin/ui";
import MediaUploadField from "@/components/admin/MediaUploadField";
import PlaceSelect from "@/components/admin/PlaceSelect";
import BulkTable from "@/components/admin/BulkTable";

const CATS = [["CAR", "Car"], ["JEEP_4WD", "Jeep (4WD)"], ["VAN", "Van"]];

export default async function VehiclesAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string; deleted?: string }> }) {
  const { edit, error, deleted } = await searchParams;
  const editing = edit !== undefined;
  const rec = edit && edit !== "new" ? await prisma.vehicle.findUnique({ where: { id: edit }, include: { coverImage: true } }) : null;
  const [vehicles, places] = await Promise.all([
    prisma.vehicle.findMany({ include: { coverImage: true, pickupPlace: true } }),
    prisma.place.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <AdminHeader title="Book Hiace" subtitle={`${vehicles.length} vehicles for rental`} addHref="/admin/vehicles?edit=new" addLabel="Add vehicle" editing={editing} />
      {error === "inuse" && <Notice kind="error">Some vehicles couldn&apos;t be deleted — they have bookings.</Notice>}
      {deleted && <Notice kind="success">Selected vehicles deleted.</Notice>}
      {editing && (
        <FormCard>
          <h2 className="mb-3 font-bold">{rec ? "Edit vehicle" : "New vehicle"}</h2>
          <form action={upsertVehicle} className="grid gap-3 sm:grid-cols-3">
            {rec && <input type="hidden" name="id" value={rec.id} />}
            <Field label="Model *"><input name="model" required defaultValue={rec?.model} className="gs-input" /></Field>
            <Field label="Category">
              <select name="category" defaultValue={rec?.category ?? "JEEP_4WD"} className="gs-input">
                {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Seats"><input name="seats" type="number" defaultValue={rec?.seats ?? 7} className="gs-input" /></Field>
            <Field label="Transmission">
              <select name="transmission" defaultValue={rec?.transmission ?? "Manual"} className="gs-input">
                <option>Manual</option><option>Automatic</option>
              </select>
            </Field>
            <Field label="Drive type">
              <select name="driveType" defaultValue={rec?.driveType ?? "4WD"} className="gs-input">
                <option>4WD</option><option>2WD</option>
              </select>
            </Field>
            <Field label="Price / day (NPR) *"><input name="pricePerDay" type="number" required defaultValue={rec?.pricePerDay ?? 9000} className="gs-input" /></Field>
            <Field label="Deposit (NPR)"><input name="deposit" type="number" defaultValue={rec?.deposit ?? 10000} className="gs-input" /></Field>
            <Field label="Pickup place">
              <PlaceSelect name="pickupPlaceId" options={places} defaultValue={rec?.pickupPlaceId ?? ""} allowNone />
            </Field>
            <Field label="Mileage policy"><input name="mileagePolicy" defaultValue={rec?.mileagePolicy ?? "Unlimited mileage"} className="gs-input" /></Field>
            <MediaUploadField name="coverImageId" label="Cover image" defaultId={rec?.coverImageId} defaultUrl={rec?.coverImage?.url} />
            <Field label="Options">
              <div className="flex flex-col gap-1 pt-1 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" name="selfDrive" defaultChecked={rec?.selfDrive ?? true} /> Self-drive</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="withDriver" defaultChecked={rec?.withDriver ?? true} /> With driver</label>
              </div>
            </Field>
            <Field label="Status">
              <select name="status" defaultValue={rec?.status ?? "active"} className="gs-input">
                <option value="active">active</option><option value="hidden">hidden</option>
              </select>
            </Field>
            <div className="sm:col-span-3"><button className="gs-btn gs-btn-primary">{rec ? "Save changes" : "Create vehicle"}</button></div>
          </form>
        </FormCard>
      )}
      <BulkTable
        model="vehicle"
        editBase="/admin/vehicles?edit="
        singleDelete={deleteVehicle}
        labelKey="model"
        columns={[
          { key: "model", label: "Model" },
          { key: "category", label: "Category", kind: "chip" },
          { key: "seats", label: "Seats" },
          { key: "drive", label: "Drive" },
          { key: "price", label: "Price/day", kind: "money" },
          { key: "status", label: "Status" },
        ]}
        rows={vehicles.map((v) => ({
          id: v.id,
          model: v.model,
          category: v.category,
          seats: v.seats,
          drive: v.driveType,
          price: v.pricePerDay,
          status: v.status,
        }))}
      />
    </div>
  );
}
