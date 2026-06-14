import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { upsertRoom, deleteRoom, removeHotelImage } from "@/app/admin/actions";
import { Field } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import GalleryUploader from "@/components/admin/GalleryUploader";
import { npr } from "@/lib/format";

const MEALS = ["Room only", "Breakfast", "Half board", "Full board"];

export default async function HotelManage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ room?: string }>;
}) {
  const { id } = await params;
  const { room } = await searchParams;
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: { rooms: true, images: { include: { media: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!hotel) notFound();
  const editingRoom = room ? hotel.rooms.find((r) => r.id === room) : null;

  return (
    <div>
      <Link href="/admin/hotels" className="mb-3 inline-flex items-center gap-1 text-sm text-gsviolet"><ArrowLeft size={15} /> Back to hotels</Link>
      <h1 className="text-2xl font-bold">{hotel.name}</h1>
      <p className="text-sm text-[var(--muted)]">Manage room types and gallery images</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {/* Rooms */}
        <div className="gs-card p-5">
          <h2 className="mb-3 font-bold">Room types</h2>
          <div className="space-y-2">
            {hotel.rooms.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 text-sm">
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-[var(--muted)]">{r.capacity} guests · {r.beds} · {r.mealPlan} · {r.roomsAvailable} left</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold gs-text-gradient">{npr(r.pricePerNight)}</span>
                  <Link href={`/admin/hotels/${id}?room=${r.id}`} className="text-gsviolet">Edit</Link>
                  <DeleteButton action={deleteRoom} id={r.id} hidden={{ hotelId: id }} iconOnly />
                </div>
              </div>
            ))}
            {hotel.rooms.length === 0 && <p className="text-sm text-[var(--muted)]">No rooms yet.</p>}
          </div>

          <form action={upsertRoom} className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
            <input type="hidden" name="hotelId" value={id} />
            {editingRoom && <input type="hidden" name="id" value={editingRoom.id} />}
            <h3 className="font-semibold sm:col-span-2">{editingRoom ? "Edit room" : "Add room type"}</h3>
            <Field label="Name *"><input name="name" required defaultValue={editingRoom?.name} className="gs-input" /></Field>
            <Field label="Capacity"><input name="capacity" type="number" defaultValue={editingRoom?.capacity ?? 2} className="gs-input" /></Field>
            <Field label="Beds"><input name="beds" defaultValue={editingRoom?.beds ?? "1 Double"} className="gs-input" /></Field>
            <Field label="Meal plan">
              <select name="mealPlan" defaultValue={editingRoom?.mealPlan ?? "Breakfast"} className="gs-input">
                {MEALS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Price / night *"><input name="pricePerNight" type="number" required defaultValue={editingRoom?.pricePerNight ?? 2500} className="gs-input" /></Field>
            <Field label="Rooms available"><input name="roomsAvailable" type="number" defaultValue={editingRoom?.roomsAvailable ?? 5} className="gs-input" /></Field>
            <div className="sm:col-span-2 flex gap-2">
              <button className="gs-btn gs-btn-primary">{editingRoom ? "Save room" : "Add room"}</button>
              {editingRoom && <Link href={`/admin/hotels/${id}`} className="gs-btn gs-btn-ghost">Cancel</Link>}
            </div>
          </form>
        </div>

        {/* Images */}
        <div className="gs-card p-5">
          <h2 className="mb-3 font-bold">Gallery images</h2>
          <div className="grid grid-cols-3 gap-2">
            {hotel.images.map((im) => (
              <div key={im.id} className="relative overflow-hidden rounded-lg border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.media.url} alt="" className="h-24 w-full object-cover" />
                <div className="absolute right-1 top-1">
                  <DeleteButton action={removeHotelImage} id={im.id} hidden={{ hotelId: id }} iconOnly confirmText="Remove this image?" />
                </div>
              </div>
            ))}
            {hotel.images.length === 0 && <p className="col-span-3 text-sm text-[var(--muted)]">No images yet.</p>}
          </div>
          <GalleryUploader hotelId={id} nextOrder={hotel.images.length} />
        </div>
      </div>
    </div>
  );
}
