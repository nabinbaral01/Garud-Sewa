import Link from "next/link";
import { Bus, Hotel, Car, CalendarCheck, Wallet, Clock, Users, Plus, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { npr, fmtDate, serviceLabel } from "@/lib/format";
import LineChart from "@/components/admin/LineChart";
import ClickableRow from "@/components/admin/ClickableRow";

function startOf(period: "day" | "week" | "month"): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === "week") d.setDate(d.getDate() - 7);
  if (period === "month") d.setDate(1);
  return d;
}

export default async function Dashboard() {
  const [today, week, month, revenueAgg, buses, hotels, vehicles, pending, users, recent, allForChart] =
    await Promise.all([
      prisma.booking.count({ where: { deleted: false, createdAt: { gte: startOf("day") } } }),
      prisma.booking.count({ where: { deleted: false, createdAt: { gte: startOf("week") } } }),
      prisma.booking.count({ where: { deleted: false, createdAt: { gte: startOf("month") } } }),
      prisma.booking.aggregate({ _sum: { amount: true }, where: { deleted: false, status: { in: ["CONFIRMED", "COMPLETED"] } } }),
      prisma.bus.count({ where: { status: "active" } }),
      prisma.hotel.count({ where: { status: "active" } }),
      prisma.vehicle.count({ where: { status: "active" } }),
      prisma.booking.count({ where: { deleted: false, status: "PENDING" } }),
      prisma.user.count(),
      prisma.booking.findMany({
        where: { deleted: false },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { bus: { include: { fromPlace: true, toPlace: true } }, hotel: true, vehicle: true },
      }),
      prisma.booking.findMany({ where: { deleted: false }, select: { createdAt: true, serviceType: true } }),
    ]);

  // bookings over last 7 days, split by service
  const dayLabels: string[] = [];
  const busSeries: number[] = [];
  const hotelSeries: number[] = [];
  const vehicleSeries: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const inDay = allForChart.filter((b) => b.createdAt >= d && b.createdAt < next);
    dayLabels.push(d.toLocaleDateString("en", { weekday: "short" }));
    busSeries.push(inDay.filter((b) => b.serviceType === "BUS").length);
    hotelSeries.push(inDay.filter((b) => b.serviceType === "HOTEL").length);
    vehicleSeries.push(inDay.filter((b) => b.serviceType === "VEHICLE").length);
  }
  const byService = {
    BUS: allForChart.filter((b) => b.serviceType === "BUS").length,
    HOTEL: allForChart.filter((b) => b.serviceType === "HOTEL").length,
    VEHICLE: allForChart.filter((b) => b.serviceType === "VEHICLE").length,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-[var(--muted)]">Overview of Garud Sewa operations</p>

      {/* quick actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <QuickAction href="/admin/buses?edit=new" icon={<Bus size={14} />} label="Add Hiace" />
        <QuickAction href="/admin/hotels?edit=new" icon={<Hotel size={14} />} label="Add hotel" />
        <QuickAction href="/admin/vehicles?edit=new" icon={<Car size={14} />} label="Add Book-Hiace" />
        <QuickAction href="/admin/places?edit=new" icon={<MapPin size={14} />} label="Add place" />
      </div>

      {/* stat cards */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<CalendarCheck />} label="Bookings today" value={String(today)} sub={`${week} this week · ${month} this month`} />
        <Stat icon={<Wallet />} label="Revenue" value={npr(revenueAgg._sum.amount ?? 0)} sub="Confirmed bookings only" />
        <Stat icon={<Clock />} label="Pending bookings" value={String(pending)} sub="Awaiting confirmation" />
        <Stat icon={<Users />} label="Customers" value={String(users)} sub="Registered users" />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Stat icon={<Bus />} label="Active Hiace" value={String(buses)} />
        <Stat icon={<Hotel />} label="Active hotels" value={String(hotels)} />
        <Stat icon={<Car />} label="Book-Hiace fleet" value={String(vehicles)} />
      </div>

      {/* charts — one section per service */}
      <h2 className="mt-6 mb-3 text-lg font-bold">Bookings — last 7 days</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Hiace" color="#1d4ed8" total={byService.BUS}>
          <LineChart labels={dayLabels} height={170} series={[{ name: "Hiace", color: "#1d4ed8", values: busSeries }]} />
        </ChartCard>
        <ChartCard title="Hotel" color="#7c3aed" total={byService.HOTEL}>
          <LineChart labels={dayLabels} height={170} series={[{ name: "Hotel", color: "#7c3aed", values: hotelSeries }]} />
        </ChartCard>
        <ChartCard title="Book Hiace" color="#10b981" total={byService.VEHICLE}>
          <LineChart labels={dayLabels} height={170} series={[{ name: "Book Hiace", color: "#10b981", values: vehicleSeries }]} />
        </ChartCard>
      </div>

      {/* recent bookings */}
      <div className="mt-5 gs-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">Recent bookings</h3>
          <Link href="/admin/bookings" className="text-sm text-gsviolet">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="gs-table">
            <thead>
              <tr><th>Ref</th><th>Service</th><th>Customer</th><th>Detail</th><th>Amount</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <ClickableRow key={b.id} href={`/admin/bookings/${b.id}`}>
                  <td className="font-mono text-xs">{b.ref}</td>
                  <td><span className="gs-chip">{serviceLabel(b.serviceType)}</span></td>
                  <td>{b.customerName}</td>
                  <td className="text-[var(--muted)]">
                    {b.bus ? `${b.boardFrom || b.bus.fromPlace.nameEn}→${b.dropTo || b.bus.toPlace.nameEn}` : b.hotel?.name || b.vehicle?.model || "—"}
                  </td>
                  <td>{npr(b.amount)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td className="text-[var(--muted)]">{fmtDate(b.createdAt)}</td>
                </ClickableRow>
              ))}
              {recent.length === 0 && <tr><td colSpan={7} className="text-center text-[var(--muted)]">No bookings yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, color, total, children }: { title: string; color: string; total: number; children: React.ReactNode }) {
  return (
    <div className="gs-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
          <h3 className="font-bold">{title}</h3>
        </div>
        <span className="text-sm text-[var(--muted)]">{total} total</span>
      </div>
      {children}
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="gs-card p-4">
      <div className="flex items-center gap-2 text-gsviolet">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
      {sub && <div className="text-xs text-[var(--muted)]">{sub}</div>}
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="gs-btn gs-btn-ghost text-sm">
      <Plus size={14} /> {icon} {label}
    </Link>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    CONFIRMED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-rose-100 text-rose-700",
    COMPLETED: "bg-slate-200 text-slate-700",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] || ""}`}>{status}</span>;
}
