import { prisma } from "@/lib/db";
import { upsertHotel, deleteHotel } from "@/app/admin/actions";
import { AdminHeader, Field, FormCard, Notice } from "@/components/admin/ui";
import MediaUploadField from "@/components/admin/MediaUploadField";
import PlaceSelect from "@/components/admin/PlaceSelect";
import AmenitiesPicker from "@/components/admin/AmenitiesPicker";
import BulkTable from "@/components/admin/BulkTable";

const BADGES = ["Budget", "Comfort", "Premium", "Luxury"];
const HOTEL_AMENITIES = ["Free WiFi", "Parking", "Restaurant", "Hot water", "Room service", "AC", "TV", "Breakfast", "Laundry", "Heater", "Power backup", "Mountain view"];

export default async function HotelsAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string; deleted?: string }> }) {
  const { edit, error, deleted } = await searchParams;
  const editing = edit !== undefined;
  const rec = edit && edit !== "new" ? await prisma.hotel.findUnique({ where: { id: edit }, include: { coverImage: true } }) : null;
  const [hotels, places] = await Promise.all([
    prisma.hotel.findMany({ include: { place: true, _count: { select: { rooms: true } } } }),
    prisma.place.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <AdminHeader title="Hotels" subtitle={`${hotels.length} stays`} addHref="/admin/hotels?edit=new" addLabel="Add hotel" editing={editing} />
      {error === "inuse" && <Notice kind="error">Some hotels couldn&apos;t be deleted — they have bookings.</Notice>}
      {deleted && <Notice kind="success">Selected hotels deleted.</Notice>}
      {editing && (
        <FormCard>
          <h2 className="mb-3 font-bold">{rec ? "Edit hotel" : "New hotel"}</h2>
          <form action={upsertHotel} className="grid gap-3 sm:grid-cols-3">
            {rec && <input type="hidden" name="id" value={rec.id} />}
            <Field label="Name *"><input name="name" required defaultValue={rec?.name} className="gs-input" /></Field>
            <Field label="Place *">
              <PlaceSelect name="placeId" options={places} defaultValue={rec?.placeId} required />
            </Field>
            <Field label="Address"><input name="address" defaultValue={rec?.address ?? ""} className="gs-input" /></Field>
            <Field label="Star rating"><input name="starRating" type="number" min="1" max="5" defaultValue={rec?.starRating ?? 3} className="gs-input" /></Field>
            <Field label="Quality badge">
              <select name="qualityBadge" defaultValue={rec?.qualityBadge ?? "Comfort"} className="gs-input">
                {BADGES.map((bd) => <option key={bd}>{bd}</option>)}
              </select>
            </Field>
            <MediaUploadField name="coverImageId" label="Cover image" defaultId={rec?.coverImageId} defaultUrl={rec?.coverImage?.url} />
            <Field label="Check-in"><input name="checkInTime" type="time" defaultValue={rec?.checkInTime ?? "13:00"} className="gs-input" /></Field>
            <Field label="Check-out"><input name="checkOutTime" type="time" defaultValue={rec?.checkOutTime ?? "11:00"} className="gs-input" /></Field>
            <Field label="Status">
              <select name="status" defaultValue={rec?.status ?? "active"} className="gs-input">
                <option value="active">active</option><option value="hidden">hidden</option>
              </select>
            </Field>
            <Field label="Description (English)" full><textarea name="descEn" rows={2} defaultValue={rec?.descEn ?? ""} className="gs-input" /></Field>
            <Field label="Amenities" full><AmenitiesPicker name="amenities" defaultValue={rec?.amenities ?? "Free WiFi,Parking,Restaurant"} suggestions={HOTEL_AMENITIES} /></Field>
            <Field label="Cancellation policy" full><input name="cancellation" defaultValue={rec?.cancellation ?? "Free cancellation up to 24h before check-in"} className="gs-input" /></Field>
            <input type="hidden" name="descNe" value={rec?.descNe ?? ""} />
            <div className="sm:col-span-3"><button className="gs-btn gs-btn-primary">{rec ? "Save changes" : "Create hotel"}</button></div>
          </form>
        </FormCard>
      )}
      <BulkTable
        model="hotel"
        editBase="/admin/hotels?edit="
        manageBase="/admin/hotels/"
        manageLabel="Rooms & images"
        singleDelete={deleteHotel}
        labelKey="name"
        columns={[
          { key: "name", label: "Hotel" },
          { key: "place", label: "Place" },
          { key: "stars", label: "Stars" },
          { key: "badge", label: "Badge", kind: "chip" },
          { key: "rooms", label: "Rooms" },
        ]}
        rows={hotels.map((h) => ({
          id: h.id,
          name: h.name,
          place: h.place.nameEn,
          stars: `${h.starRating} ★`,
          badge: h.qualityBadge,
          rooms: h._count.rooms,
        }))}
      />
    </div>
  );
}
