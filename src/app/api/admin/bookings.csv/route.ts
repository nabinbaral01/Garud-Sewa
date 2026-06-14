import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const where: Record<string, unknown> = { deleted: false };
  const service = searchParams.get("service");
  const status = searchParams.get("status");
  const operator = searchParams.get("operator");
  const busId = searchParams.get("bus");
  if (service) where.serviceType = service;
  if (status) where.status = status;
  if (busId) where.busId = busId;
  if (operator) where.bus = { operatorId: operator };

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { bus: { include: { fromPlace: true, toPlace: true, operator: true } }, hotel: true, vehicle: true },
  });

  const headers = ["Ref", "Service", "Status", "Customer", "Phone", "Email", "Detail", "Operator", "Vehicle no", "Amount", "Created"];
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = bookings.map((b) => {
    const detail = b.bus
      ? `${b.boardFrom || b.bus.fromPlace.nameEn} to ${b.dropTo || b.bus.toPlace.nameEn} (${b.seats || ""})`
      : b.hotel?.name || b.vehicle?.model || "";
    return [
      b.ref, b.serviceType, b.status, b.customerName, b.customerPhone, b.customerEmail || "",
      detail, b.bus?.operator.name || "", b.bus?.vehicleNumber || "", String(b.amount), b.createdAt.toISOString(),
    ].map(esc).join(",");
  });
  const csv = [headers.map(esc).join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gadur-sewa-bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
