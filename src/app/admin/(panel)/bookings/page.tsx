import Link from "next/link";
import { Download, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import BookingsTable from "@/components/admin/BookingsTable";
import { npr, fmtDate, serviceLabel } from "@/lib/format";

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

export default async function BookingsAdmin({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; status?: string; bin?: string; operator?: string; bus?: string }>;
}) {
  const sp = await searchParams;
  const bin = sp.bin === "1";
  const session = await getSession();

  const where: Record<string, unknown> = { deleted: bin };
  if (sp.service) where.serviceType = sp.service;
  if (sp.status) where.status = sp.status;
  if (sp.bus) where.busId = sp.bus;
  if (sp.operator) where.bus = { operatorId: sp.operator };

  const [bookings, operators, buses] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { bus: { include: { fromPlace: true, toPlace: true, operator: true } }, hotel: true, vehicle: true },
    }),
    prisma.operator.findMany({ orderBy: { name: "asc" } }),
    prisma.bus.findMany({ include: { fromPlace: true, toPlace: true }, orderBy: { departTime: "asc" } }),
  ]);

  const chip = (active: boolean) => `gs-chip ${active ? "gs-gradient text-white" : ""}`;
  // preserve all current filters when changing one
  const qs = (extra: Record<string, string>) => {
    const params: Record<string, string> = {};
    if (sp.service) params.service = sp.service;
    if (sp.status) params.status = sp.status;
    if (sp.operator) params.operator = sp.operator;
    if (sp.bus) params.bus = sp.bus;
    Object.assign(params, extra);
    for (const k of Object.keys(params)) if (!params[k]) delete params[k];
    const q = new URLSearchParams(params).toString();
    return `/admin/bookings${q ? `?${q}` : ""}`;
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{bin ? "Recycle bin" : "Bookings"}</h1>
          <p className="text-sm text-[var(--muted)]">{bookings.length} booking(s)</p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/admin/bookings.csv${qs({}).replace("/admin/bookings", "")}`} className="gs-btn gs-btn-ghost text-sm"><Download size={15} /> Export CSV</a>
          {bin ? (
            <Link href="/admin/bookings" className="gs-btn gs-btn-ghost text-sm">← All bookings</Link>
          ) : (
            <Link href="/admin/bookings?bin=1" className="gs-btn gs-btn-ghost text-sm"><Trash2 size={15} /> Recycle bin</Link>
          )}
        </div>
      </div>

      {!bin && (
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[var(--muted)]">Service:</span>
            <Link href={qs({ service: "" })} className={chip(!sp.service)}>All</Link>
            {["BUS", "HOTEL", "VEHICLE"].map((s) => (
              <Link key={s} href={qs({ service: s })} className={chip(sp.service === s)}>{serviceLabel(s)}</Link>
            ))}
            <span className="ml-3 text-[var(--muted)]">Status:</span>
            <Link href={qs({ status: "" })} className={chip(!sp.status)}>All</Link>
            {STATUSES.map((s) => (
              <Link key={s} href={qs({ status: s })} className={chip(sp.status === s)}>{s}</Link>
            ))}
          </div>

          {/* operator + vehicle filters (Hiace) */}
          <form method="get" className="flex flex-wrap items-end gap-2 text-sm">
            {sp.service && <input type="hidden" name="service" value={sp.service} />}
            {sp.status && <input type="hidden" name="status" value={sp.status} />}
            <div>
              <label className="gs-label">Operator</label>
              <select name="operator" defaultValue={sp.operator ?? ""} className="gs-input !py-1.5">
                <option value="">All operators</option>
                {operators.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="gs-label">Vehicle (Hiace)</label>
              <select name="bus" defaultValue={sp.bus ?? ""} className="gs-input !py-1.5">
                <option value="">All vehicles</option>
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.vehicleNumber ? `${b.vehicleNumber} — ` : ""}{b.fromPlace.nameEn}→{b.toPlace.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <button className="gs-btn gs-btn-primary !py-1.5">Apply</button>
            {(sp.operator || sp.bus) && <Link href={qs({ operator: "", bus: "" })} className="gs-btn gs-btn-ghost !py-1.5">Clear</Link>}
          </form>
        </div>
      )}

      <BookingsTable
        bin={bin}
        isSuperAdmin={session?.role === "SUPER_ADMIN"}
        rows={bookings.map((b) => ({
          id: b.id,
          ref: b.ref,
          service: serviceLabel(b.serviceType),
          detail: b.bus
            ? `${b.boardFrom || b.bus.fromPlace.nameEn}→${b.dropTo || b.bus.toPlace.nameEn} · ${b.seats || ""}`
            : b.hotel?.name || b.vehicle?.model || "—",
          vehicle: b.bus
            ? `${b.bus.operator.name}${b.bus.vehicleNumber ? ` · ${b.bus.vehicleNumber}` : ""}`
            : "",
          customer: b.customerName,
          phone: b.customerPhone,
          amount: npr(b.amount),
          status: b.status,
          date: fmtDate(b.createdAt),
        }))}
      />
    </div>
  );
}
