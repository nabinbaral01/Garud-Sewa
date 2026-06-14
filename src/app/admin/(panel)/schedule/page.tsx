import { prisma } from "@/lib/db";
import { isoDate, addDays, fmtTime, csv, npr } from "@/lib/format";
import { effectiveStops } from "@/lib/stops";
import { StatusBadge } from "../page";
import { Bus, Hotel, Calendar } from "lucide-react";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.date || isoDate(new Date());
  const dayStart = new Date(date + "T00:00:00");
  const dayEnd = new Date(date + "T23:59:59");

  const [buses, busBookings, hotels, hotelBookings] = await Promise.all([
    prisma.bus.findMany({
      where: { status: "active" },
      include: { operator: true, fromPlace: true, toPlace: true },
      orderBy: { departTime: "asc" },
    }),
    prisma.booking.findMany({
      where: { serviceType: "BUS", deleted: false, status: { not: "CANCELLED" }, travelDate: { gte: dayStart, lte: dayEnd } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.hotel.findMany({ include: { place: true }, orderBy: { name: "asc" } }),
    // hotel stays that cover the night of the selected date
    prisma.booking.findMany({
      where: {
        serviceType: "HOTEL",
        deleted: false,
        status: { not: "CANCELLED" },
        checkIn: { lte: dayEnd },
        checkOut: { gt: dayStart },
      },
      include: { roomType: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const seatsCount = (s: string | null | undefined) => csv(s).length;
  const totalBusPax = busBookings.reduce((n, b) => n + seatsCount(b.seats), 0);
  const totalHotelGuests = hotelBookings.reduce((n, b) => n + (b.guests ?? 0), 0);

  const prev = isoDate(addDays(new Date(date), -1));
  const next = isoDate(addDays(new Date(date), 1));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Daily schedule</h1>
          <p className="text-sm text-[var(--muted)]">Routes, passengers and hotel occupancy for a chosen day</p>
        </div>
        <form method="get" className="flex items-end gap-2">
          <a href={`/admin/schedule?date=${prev}`} className="gs-btn gs-btn-ghost text-sm">←</a>
          <div>
            <label className="gs-label flex items-center gap-1"><Calendar size={13} /> Date</label>
            <input type="date" name="date" defaultValue={date} className="gs-input" />
          </div>
          <button className="gs-btn gs-btn-primary text-sm">View</button>
          <a href={`/admin/schedule?date=${next}`} className="gs-btn gs-btn-ghost text-sm">→</a>
        </form>
      </div>

      {/* summary */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="gs-card flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-gsviolet"><Bus size={18} /></span>
          <div><div className="text-2xl font-extrabold">{totalBusPax}</div><div className="text-xs text-[var(--muted)]">Hiace passengers on {date}</div></div>
        </div>
        <div className="gs-card flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-gsviolet"><Hotel size={18} /></span>
          <div><div className="text-2xl font-extrabold">{totalHotelGuests}</div><div className="text-xs text-[var(--muted)]">Hotel guests staying this night</div></div>
        </div>
      </div>

      {/* Hiace trips */}
      <h2 className="mb-3 text-lg font-bold">Hiace routes &amp; passengers</h2>
      <div className="space-y-4">
        {buses.map((b) => {
          const list = busBookings.filter((bk) => bk.busId === b.id);
          const pax = list.reduce((n, bk) => n + seatsCount(bk.seats), 0);
          const stops = effectiveStops(b.stops, b.fromPlace.nameEn, b.toPlace.nameEn, b.baseFare);
          return (
            <div key={b.id} className="gs-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold">{b.fromPlace.nameEn} → {b.toPlace.nameEn}</div>
                  <div className="text-xs text-[var(--muted)]">{b.operator.name} · {b.busType} · departs {fmtTime(b.departTime)}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">Route: {stops.map((s) => s.name).join(" → ")}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold gs-text-gradient">{pax}/{b.totalSeats}</div>
                  <div className="text-xs text-[var(--muted)]">seats booked</div>
                </div>
              </div>
              {list.length > 0 ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="gs-table">
                    <thead><tr><th>Ref</th><th>Passenger</th><th>Segment</th><th>Seats</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {list.map((bk) => (
                        <tr key={bk.id}>
                          <td className="font-mono text-xs">{bk.ref}</td>
                          <td><div className="font-medium">{bk.customerName}</div><div className="text-xs text-[var(--muted)]">{bk.customerPhone}</div></td>
                          <td className="text-xs text-[var(--muted)]">{bk.boardFrom || b.fromPlace.nameEn} → {bk.dropTo || b.toPlace.nameEn}</td>
                          <td>{bk.seats}</td>
                          <td>{npr(bk.amount)}</td>
                          <td><StatusBadge status={bk.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-2 text-sm text-[var(--muted)]">No passengers booked for this date.</p>
              )}
            </div>
          );
        })}
        {buses.length === 0 && <p className="text-sm text-[var(--muted)]">No active Hiace.</p>}
      </div>

      {/* Hotel occupancy */}
      <h2 className="mb-3 mt-8 text-lg font-bold">Hotel occupancy this night</h2>
      <div className="space-y-4">
        {hotels.map((h) => {
          const list = hotelBookings.filter((bk) => bk.hotelId === h.id);
          const rooms = list.reduce((n, bk) => n + (bk.rooms ?? 0), 0);
          const guests = list.reduce((n, bk) => n + (bk.guests ?? 0), 0);
          return (
            <div key={h.id} className="gs-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold">{h.name}</div>
                  <div className="text-xs text-[var(--muted)]">{h.place.nameEn}, {h.place.district}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold gs-text-gradient">{rooms} room(s)</div>
                  <div className="text-xs text-[var(--muted)]">{guests} guest(s)</div>
                </div>
              </div>
              {list.length > 0 ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="gs-table">
                    <thead><tr><th>Ref</th><th>Guest</th><th>Room</th><th>Check-in → out</th><th>Status</th></tr></thead>
                    <tbody>
                      {list.map((bk) => (
                        <tr key={bk.id}>
                          <td className="font-mono text-xs">{bk.ref}</td>
                          <td><div className="font-medium">{bk.customerName}</div><div className="text-xs text-[var(--muted)]">{bk.customerPhone}</div></td>
                          <td className="text-xs text-[var(--muted)]">{bk.roomType?.name ?? "—"}</td>
                          <td className="text-xs text-[var(--muted)]">{bk.checkIn ? isoDate(bk.checkIn) : "?"} → {bk.checkOut ? isoDate(bk.checkOut) : "?"}</td>
                          <td><StatusBadge status={bk.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-2 text-sm text-[var(--muted)]">Empty this night.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
