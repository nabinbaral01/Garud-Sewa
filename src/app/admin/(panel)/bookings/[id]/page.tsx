import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { softDeleteBooking, restoreBooking, purgeBooking } from "@/app/admin/actions";
import DeleteButton from "@/components/admin/DeleteButton";
import BookingStatusForm from "@/components/admin/BookingStatusForm";
import { StatusBadge } from "../../page";
import { npr, fmtDate, csv, serviceLabel } from "@/lib/format";

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const b = await prisma.booking.findUnique({
    where: { id },
    include: {
      bus: { include: { operator: true, fromPlace: true, toPlace: true } },
      hotel: { include: { place: true } },
      roomType: true,
      vehicle: true,
      user: true,
    },
  });
  if (!b) notFound();

  const rows: [string, string][] = [
    ["Reference", b.ref],
    ["Service", serviceLabel(b.serviceType)],
    ["Booked on", fmtDate(b.createdAt)],
    ["Customer", b.customerName],
    ["Phone", b.customerPhone],
    ["Email", b.customerEmail || "—"],
  ];
  if (b.discount > 0) {
    rows.push(["Subtotal", npr(b.subtotal)]);
    rows.push(["Coupon", b.couponCode || "—"]);
    rows.push(["Discount", `− ${npr(b.discount)}`]);
  }
  rows.push(["Total payable", npr(b.amount)]);

  const serviceRows: [string, string][] = [];
  if (b.bus) {
    serviceRows.push(["Operator", b.bus.operator.name]);
    if (b.bus.vehicleNumber) serviceRows.push(["Vehicle no", b.bus.vehicleNumber]);
    serviceRows.push(["Route", `${b.boardFrom || b.bus.fromPlace.nameEn} → ${b.dropTo || b.bus.toPlace.nameEn}`]);
    serviceRows.push(["Hiace type", b.bus.busType]);
    if (b.travelDate) serviceRows.push(["Travel date", fmtDate(b.travelDate)]);
    serviceRows.push(["Departure", `${b.bus.departTime} · ${b.bus.boardingPoint}`]);
    serviceRows.push(["Seats", csv(b.seats).join(", ") || "—"]);
  }
  if (b.hotel) {
    serviceRows.push(["Hotel", b.hotel.name]);
    serviceRows.push(["Location", `${b.hotel.place.nameEn}, ${b.hotel.place.district}`]);
    if (b.roomType) serviceRows.push(["Room", b.roomType.name]);
    if (b.checkIn) serviceRows.push(["Check-in", fmtDate(b.checkIn)]);
    if (b.checkOut) serviceRows.push(["Check-out", fmtDate(b.checkOut)]);
    serviceRows.push(["Rooms / guests", `${b.rooms ?? 1} room(s) · ${b.guests ?? 1} guest(s)`]);
  }
  if (b.vehicle) {
    serviceRows.push(["Vehicle", b.vehicle.model]);
    if (b.pickupDate) serviceRows.push(["Pickup", fmtDate(b.pickupDate)]);
    if (b.returnDate) serviceRows.push(["Return", fmtDate(b.returnDate)]);
    serviceRows.push(["Driver", b.withDriver ? "With driver" : "Self-drive"]);
    if (b.oneWay) serviceRows.push(["Drop-off", b.dropPlace || "One-way"]);
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/bookings" className="mb-3 inline-flex items-center gap-1 text-sm text-gsviolet">
        <ArrowLeft size={15} /> Back to bookings
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold">{b.ref}</h1>
          <p className="text-sm text-[var(--muted)]">{serviceLabel(b.serviceType)} booking · {fmtDate(b.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={b.status} />
          <span className="text-xl font-extrabold gs-text-gradient">{npr(b.amount)}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="gs-card p-5">
          <h2 className="mb-3 font-bold">Booking</h2>
          <dl className="space-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="gs-card p-5">
          <h2 className="mb-3 font-bold">{serviceLabel(b.serviceType)} details</h2>
          <dl className="space-y-2 text-sm">
            {serviceRows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-4 gs-card p-5">
        <h2 className="mb-3 font-bold">Payment proof</h2>
        {b.paymentProof ? (
          <a href={b.paymentProof} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.paymentProof} alt="Payment proof" className="max-h-80 rounded-lg border border-[var(--border)]" />
            <span className="mt-1 block text-xs text-gsviolet">Open full size ↗</span>
          </a>
        ) : (
          <p className="text-sm text-[var(--muted)]">No payment screenshot uploaded.</p>
        )}
      </div>

      <div className="mt-4 gs-card p-5">
        <h2 className="mb-3 font-bold">Manage</h2>
        <BookingStatusForm id={b.id} status={b.status} notes={b.notes} />

        <div className="mt-4 flex items-center gap-3 border-t border-[var(--border)] pt-4">
          {b.deleted ? (
            <>
              <form action={restoreBooking}><input type="hidden" name="id" value={b.id} /><button className="gs-btn gs-btn-ghost">Restore</button></form>
              {session?.role === "SUPER_ADMIN" && <DeleteButton action={purgeBooking} id={b.id} label="Purge permanently" confirmText="Permanently delete this booking?" />}
            </>
          ) : (
            <DeleteButton action={softDeleteBooking} id={b.id} label="Move to recycle bin" confirmText="Move this booking to the recycle bin?" />
          )}
        </div>
      </div>
    </div>
  );
}
