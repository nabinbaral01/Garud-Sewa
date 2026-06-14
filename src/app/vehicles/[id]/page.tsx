import { notFound } from "next/navigation";
import { Users, Cog, Gauge } from "lucide-react";
import TopBar from "@/components/public/TopBar";
import Footer from "@/components/public/Footer";
import VehicleBooking from "@/components/public/VehicleBooking";
import { prisma } from "@/lib/db";
import { getCustomer } from "@/lib/customer-auth";
import { getSettings } from "@/lib/settings";
import { isoDate, addDays, daysBetween, npr } from "@/lib/format";

const CAT_LABEL: Record<string, string> = { CAR: "Car", JEEP_4WD: "Jeep (4WD)", VAN: "Van" };

export default async function VehicleDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const pickupDate = sp.pickupDate || isoDate(new Date());
  const returnDate = sp.returnDate || isoDate(addDays(new Date(), 1));
  const oneWay = sp.oneWay === "1";
  const drop = sp.drop || "";
  const days = daysBetween(new Date(pickupDate), new Date(returnDate));

  const v = await prisma.vehicle.findUnique({
    where: { id },
    include: { coverImage: true, images: { include: { media: true } }, pickupPlace: true },
  });
  if (!v) notFound();
  const customer = await getCustomer();
  const s = await getSettings();
  const payment = { qr: s.paymentQr, merchant: s.paymentMerchant, terminal: s.paymentTerminal, branch: s.paymentBranch };

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={v.coverImage?.url || ""} alt={v.model} className="h-64 w-full rounded-xl object-cover" />
          <div>
            <h1 className="text-2xl font-bold">{v.model}</h1>
            <span className="gs-chip mt-2">{CAT_LABEL[v.category]}</span>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
              <span className="flex items-center gap-1"><Users size={14} /> {v.seats} seats</span>
              <span className="flex items-center gap-1"><Cog size={14} /> {v.transmission}</span>
              <span className="flex items-center gap-1"><Gauge size={14} /> {v.driveType}</span>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">{v.mileagePolicy}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Refundable deposit: {npr(v.deposit)}</p>
            <div className="mt-4 text-2xl font-extrabold gs-text-gradient">{npr(v.pricePerDay)} <span className="text-sm font-normal text-[var(--muted)]">/ day</span></div>
          </div>
        </div>

        <div className="mt-8">
          <VehicleBooking
            vehicleId={v.id}
            pricePerDay={v.pricePerDay}
            days={days}
            pickupDate={pickupDate}
            returnDate={returnDate}
            oneWay={oneWay}
            drop={drop}
            withDriverAvailable={v.withDriver}
            selfDriveAvailable={v.selfDrive}
            customer={customer ? { name: customer.name, email: customer.email } : null}
            payment={payment}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
