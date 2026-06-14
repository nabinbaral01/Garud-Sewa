import { notFound } from "next/navigation";
import TopBar from "@/components/public/TopBar";
import Footer from "@/components/public/Footer";
import BusBooking from "@/components/public/BusBooking";
import ReviewsSection from "@/components/public/ReviewsSection";
import { prisma } from "@/lib/db";
import { getCustomer } from "@/lib/customer-auth";
import { getSettings } from "@/lib/settings";
import { csv, isoDate, fmtDuration, fmtTime } from "@/lib/format";
import { effectiveStops, segmentFare, seatsConflict, stopIdx, stopTime } from "@/lib/stops";

export default async function BusDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const date = sp.date || isoDate(new Date());

  const bus = await prisma.bus.findUnique({
    where: { id },
    include: { operator: true, fromPlace: true, toPlace: true, images: { include: { media: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!bus) notFound();

  const dayStart = new Date(date + "T00:00:00");
  const dayEnd = new Date(date + "T23:59:59");
  const sameDay = await prisma.booking.findMany({
    where: { busId: id, deleted: false, travelDate: { gte: dayStart, lte: dayEnd }, status: { not: "CANCELLED" } },
    select: { seats: true, boardFrom: true, dropTo: true },
  });
  const customer = await getCustomer();
  const s = await getSettings();
  const payment = { qr: s.paymentQr, merchant: s.paymentMerchant, terminal: s.paymentTerminal, branch: s.paymentBranch };

  // resolve the booked segment (defaults to full origin → destination)
  const stops = effectiveStops(bus.stops, bus.fromPlace.nameEn, bus.toPlace.nameEn, bus.baseFare, bus.departTime, bus.arriveTime);
  const seg =
    segmentFare(stops, sp.from || stops[0].name, sp.to || stops[stops.length - 1].name) ?? {
      fare: bus.baseFare,
      fromName: bus.fromPlace.nameEn,
      toName: bus.toPlace.nameEn,
    };

  // a seat is only taken if an existing booking's segment OVERLAPS the one being
  // booked — measured by each stop's position in THIS Hiace's own stop order (the
  // list in the admin "Route stops" editor). So a seat freed at Kanyam can be
  // resold from Kanyam onward; but Birtamod→Kanyam and Birtamod→Taplejung
  // correctly collide (they share Birtamod→Kanyam).
  const pos = (name: string) => stopIdx(stops, name);
  const reqLo = pos(seg.fromName);
  const reqHi = pos(seg.toName);
  const bookedSeats = sameDay
    .filter((b) =>
      seatsConflict(
        reqLo,
        reqHi,
        b.boardFrom ? pos(b.boardFrom) : 0,
        b.dropTo ? pos(b.dropTo) : stops.length - 1
      )
    )
    .flatMap((b) => csv(b.seats));

  // boarding / arrival time for the chosen segment (per-stop time)
  const boardTime = stopTime(stops, seg.fromName) || bus.departTime;
  const dropTime = stopTime(stops, seg.toName) || bus.arriveTime;

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold">
          {seg.fromName} → {seg.toName}
        </h1>
        <div className="mb-4 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
          <span>{bus.operator.name} · {bus.busType}</span>
          {bus.durationMin > 0 && <span>Duration: {fmtDuration(bus.durationMin)}</span>}
          {bus.vehicleNumber && <span>Vehicle no: <span className="font-semibold text-[var(--ink)]">{bus.vehicleNumber}</span></span>}
        </div>

        {bus.images.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 font-bold">Vehicle photos (interior &amp; exterior)</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {bus.images.map((im) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={im.id} src={im.media.url} alt="Hiace photo" className="h-32 w-full rounded-xl object-cover" />
              ))}
            </div>
          </div>
        )}
        {sp.seatTaken && (
          <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Sorry, one of those seats was just taken for an overlapping segment. Please pick different seats.
          </div>
        )}
        <BusBooking
          date={date}
          bookedSeats={bookedSeats}
          customer={customer ? { name: customer.name, email: customer.email } : null}
          payment={payment}
          boardFrom={seg.fromName}
          dropTo={seg.toName}
          bus={{
            id: bus.id,
            operator: bus.operator.name,
            busType: bus.busType,
            boardingPoint: bus.boardingPoint,
            dropPoint: bus.dropPoint,
            totalSeats: bus.totalSeats,
            seatLayout: bus.seatLayout,
            baseFare: seg.fare,
            fromName: seg.fromName,
            toName: seg.toName,
            departTime: boardTime,
            arriveTime: dropTime,
          }}
        />

        {/* full stop schedule with times */}
        <div className="mt-8">
          <h2 className="mb-3 text-xl font-bold">Route &amp; timings</h2>
          <ol className="gs-card divide-y divide-[var(--border)] p-2">
            {stops.map((st, i) => (
              <li key={st.name + i} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-gsviolet">{i + 1}</span>
                  {st.name}
                </span>
                <span className="text-[var(--muted)]">{st.time ? fmtTime(st.time) : "—"}</span>
              </li>
            ))}
          </ol>
        </div>

        <ReviewsSection serviceType="BUS" serviceId={bus.id} />
      </main>
      <Footer />
    </>
  );
}
