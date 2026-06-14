import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import TopBar from "@/components/public/TopBar";
import Footer from "@/components/public/Footer";
import { prisma } from "@/lib/db";
import { npr, fmtDate, serviceLabel } from "@/lib/format";

export default async function BookingSuccess({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const booking = ref
    ? await prisma.booking.findUnique({
        where: { ref },
        include: { bus: { include: { fromPlace: true, toPlace: true } }, hotel: true, roomType: true, vehicle: true },
      })
    : null;

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="gs-card p-8 text-center">
          <CheckCircle2 size={56} className="mx-auto text-emerald-500" />
          <h1 className="mt-4 text-2xl font-bold">Booking confirmed!</h1>
          <p className="mt-1 text-[var(--muted)]">Book now, pay later. Show this reference when you travel.</p>

          {booking ? (
            <div className="mt-6 space-y-2 rounded-xl bg-[var(--bg)] p-5 text-left text-sm">
              <Row k="Reference" v={booking.ref} strong />
              <Row k="Service" v={serviceLabel(booking.serviceType)} />
              <Row k="Status" v={booking.status} />
              <Row k="Name" v={booking.customerName} />
              <Row k="Phone" v={booking.customerPhone} />
              {booking.bus && <Row k="Route" v={`${booking.boardFrom || booking.bus.fromPlace.nameEn} → ${booking.dropTo || booking.bus.toPlace.nameEn}`} />}
              {booking.travelDate && <Row k="Travel date" v={fmtDate(booking.travelDate)} />}
              {booking.seats && <Row k="Seats" v={booking.seats} />}
              {booking.hotel && <Row k="Hotel" v={booking.hotel.name} />}
              {booking.roomType && <Row k="Room" v={booking.roomType.name} />}
              {booking.checkIn && <Row k="Check-in" v={fmtDate(booking.checkIn)} />}
              {booking.checkOut && <Row k="Check-out" v={fmtDate(booking.checkOut)} />}
              {booking.vehicle && <Row k="Vehicle" v={booking.vehicle.model} />}
              {booking.pickupDate && <Row k="Pickup" v={fmtDate(booking.pickupDate)} />}

              {booking.discount > 0 && (
                <div className="mt-2 space-y-2 border-t border-[var(--border)] pt-2">
                  <Row k="Subtotal" v={npr(booking.subtotal)} />
                  <Row k={`Coupon (${booking.couponCode})`} v={`− ${npr(booking.discount)}`} />
                </div>
              )}
              <div className="mt-1 border-t border-[var(--border)] pt-2">
                <Row k="Total payable" v={npr(booking.amount)} strong />
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-[var(--muted)]">Booking reference not found.</p>
          )}

          {booking && booking.discount > 0 && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <div className="text-sm font-bold">🎉 Coupon {booking.couponCode} applied</div>
              <div className="mt-0.5 text-sm">
                You got <span className="font-bold">{npr(booking.discount)}</span> off
                {booking.subtotal > 0 && ` (${Math.round((booking.discount / booking.subtotal) * 100)}%)`} — paying{" "}
                <span className="font-bold">{npr(booking.amount)}</span> instead of {npr(booking.subtotal)}.
              </div>
            </div>
          )}

          <Link href="/" className="gs-btn gs-btn-primary mt-6">Back to home</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--muted)]">{k}</span>
      <span className={strong ? "font-bold" : "font-medium"}>{v}</span>
    </div>
  );
}
