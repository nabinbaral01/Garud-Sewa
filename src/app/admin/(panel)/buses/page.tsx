import { prisma } from "@/lib/db";
import { upsertBus, deleteBus } from "@/app/admin/actions";
import { AdminHeader, Field, FormCard, Notice } from "@/components/admin/ui";
import BulkTable from "@/components/admin/BulkTable";
import PlaceSelect from "@/components/admin/PlaceSelect";
import OperatorSelect from "@/components/admin/OperatorSelect";
import AmenitiesPicker from "@/components/admin/AmenitiesPicker";
import StopsEditor from "@/components/admin/StopsEditor";
import BusGallery from "@/components/admin/BusGallery";
import { fmtTime } from "@/lib/format";

const TYPES = ["Deluxe", "AC", "Local", "Micro", "Jeep-Sharing"];
const BUS_AMENITIES = ["AC", "WiFi", "Water", "Charging", "Reclining", "Blanket", "TV", "Snacks", "CCTV", "Fan", "Music", "4WD"];

export default async function BusesAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string; deleted?: string }> }) {
  const { edit, error, deleted } = await searchParams;
  const editing = edit !== undefined;
  const rec = edit && edit !== "new"
    ? await prisma.bus.findUnique({ where: { id: edit }, include: { images: { include: { media: true }, orderBy: { sortOrder: "asc" } } } })
    : null;
  const [buses, operators, places] = await Promise.all([
    prisma.bus.findMany({ include: { operator: true, fromPlace: true, toPlace: true }, orderBy: { departTime: "asc" } }),
    prisma.operator.findMany(),
    prisma.place.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <AdminHeader title="Hiace & schedules" subtitle={`${buses.length} schedules`} addHref="/admin/buses?edit=new" addLabel="Add Hiace" editing={editing} />
      {error === "samestop" && <Notice kind="error">From and To must be different.</Notice>}
      {error === "inuse" && <Notice kind="error">Some Hiace couldn&apos;t be deleted — they have bookings.</Notice>}
      {deleted && <Notice kind="success">Selected Hiace deleted.</Notice>}
      {editing && (
        <FormCard>
          <h2 className="mb-3 font-bold">{rec ? "Edit Hiace" : "New Hiace"}</h2>
          <form action={upsertBus} className="grid gap-3 sm:grid-cols-3">
            {rec && <input type="hidden" name="id" value={rec.id} />}
            <Field label="Operator *">
              <OperatorSelect name="operatorId" options={operators} defaultValue={rec?.operatorId} required />
              <p className="mt-1 text-xs text-[var(--muted)]">The Hiace operator running this service (e.g. Mechi Yatayat).</p>
            </Field>
            <Field label="From *">
              <PlaceSelect name="fromPlaceId" options={places} defaultValue={rec?.fromPlaceId} required />
            </Field>
            <Field label="To *">
              <PlaceSelect name="toPlaceId" options={places} defaultValue={rec?.toPlaceId} required />
            </Field>
            <Field label="Hiace type">
              <select name="busType" defaultValue={rec?.busType ?? "Deluxe"} className="gs-input">
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Depart time *"><input name="departTime" type="time" required defaultValue={rec?.departTime ?? "06:30"} className="gs-input" /></Field>
            <Field label="Arrive time *"><input name="arriveTime" type="time" required defaultValue={rec?.arriveTime ?? "15:00"} className="gs-input" /></Field>
            <Field label="Boarding point"><input name="boardingPoint" defaultValue={rec?.boardingPoint ?? ""} className="gs-input" /></Field>
            <Field label="Drop point"><input name="dropPoint" defaultValue={rec?.dropPoint ?? ""} className="gs-input" /></Field>
            <Field label="Base fare (NPR) *"><input name="baseFare" type="number" required defaultValue={rec?.baseFare ?? 1000} className="gs-input" /></Field>
            <Field label="Total seats"><input name="totalSeats" type="number" defaultValue={rec?.totalSeats ?? 35} className="gs-input" /></Field>
            <Field label="Seat layout">
              <select name="seatLayout" defaultValue={rec?.seatLayout ?? "hiace"} className="gs-input">
                <option value="hiace">Hiace 13-seat (1 + 4·3 + driver)</option>
                <option value="2-2">2-2</option>
                <option value="2-1">2-1</option>
              </select>
            </Field>
            <Field label="Rating"><input name="rating" type="number" step="0.1" defaultValue={rec?.rating ?? 4.2} className="gs-input" /></Field>
            <Field label="Vehicle number (plate)"><input name="vehicleNumber" defaultValue={rec?.vehicleNumber ?? ""} className="gs-input" placeholder="e.g. Me 1 Kha 1234" /></Field>
            <Field label="Amenities" full><AmenitiesPicker name="amenities" defaultValue={rec?.amenities ?? "AC,WiFi,Water,Charging"} suggestions={BUS_AMENITIES} /></Field>
            <Field label="Status">
              <select name="status" defaultValue={rec?.status ?? "active"} className="gs-input">
                <option value="active">active</option><option value="hidden">hidden</option>
              </select>
            </Field>
            <div className="sm:col-span-3">
              <label className="gs-label">Route stops & segment fares</label>
              <StopsEditor name="stops" defaultValue={rec?.stops} placeNames={places.map((p) => p.nameEn)} />
            </div>
            <div className="sm:col-span-3"><button className="gs-btn gs-btn-primary">{rec ? "Save changes" : "Create Hiace"}</button></div>
          </form>

          {rec ? (
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <h3 className="mb-2 font-bold">Photos (interior / exterior)</h3>
              <BusGallery busId={rec.id} images={rec.images.map((im) => ({ id: im.id, url: im.media.url }))} />
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-gsviolet bg-indigo-50/40 p-4 text-sm">
              <span className="font-semibold">📷 Photos (interior / exterior):</span> click <span className="font-semibold">Create Hiace</span> first, then this Hiace reopens with an
              <span className="font-semibold"> Upload photos</span> section.
            </div>
          )}
        </FormCard>
      )}
      <BulkTable
        model="bus"
        editBase="/admin/buses?edit="
        singleDelete={deleteBus}
        columns={[
          { key: "operator", label: "Operator" },
          { key: "route", label: "Route" },
          { key: "type", label: "Type", kind: "chip" },
          { key: "depart", label: "Depart" },
          { key: "arrive", label: "Arrive" },
          { key: "fare", label: "Fare", kind: "money" },
          { key: "status", label: "Status" },
        ]}
        rows={buses.map((b) => ({
          id: b.id,
          operator: b.operator.name,
          route: `${b.fromPlace.nameEn} → ${b.toPlace.nameEn}`,
          type: b.busType,
          depart: fmtTime(b.departTime),
          arrive: fmtTime(b.arriveTime),
          fare: b.baseFare,
          status: b.status,
        }))}
      />
    </div>
  );
}
