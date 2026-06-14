import Link from "next/link";
import { Users, Cog, Gauge, MapPin } from "lucide-react";
import TopBar from "@/components/public/TopBar";
import Footer from "@/components/public/Footer";
import ServiceTabs from "@/components/public/ServiceTabs";
import { getPlaceOptions } from "@/lib/places";
import { getLang } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { npr, isoDate, addDays, daysBetween } from "@/lib/format";

const CAT_LABEL: Record<string, string> = { CAR: "Car", JEEP_4WD: "Jeep (4WD)", VAN: "Van" };

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const pickup = sp.pickup || "";
  const pickupDate = sp.pickupDate || isoDate(new Date());
  const returnDate = sp.returnDate || isoDate(addDays(new Date(), 1));
  const oneWay = sp.oneWay === "1";
  const drop = sp.drop || "";
  const cat = sp.cat || "";
  const sort = sp.sort || "price";
  const days = daysBetween(new Date(pickupDate), new Date(returnDate));

  const [places, lang] = await Promise.all([getPlaceOptions(), getLang()]);
  let vehicles = await prisma.vehicle.findMany({
    where: { status: "active" },
    include: { coverImage: true, pickupPlace: true },
  });
  if (cat) vehicles = vehicles.filter((v) => v.category === cat);
  vehicles.sort((a, b) => (sort === "seats" ? b.seats - a.seats : a.pricePerDay - b.pricePerDay));

  const qs = (extra: Record<string, string>) =>
    new URLSearchParams({ pickup, pickupDate, returnDate, oneWay: oneWay ? "1" : "", drop, cat, sort, ...extra }).toString();

  return (
    <>
      <TopBar />
      <div className="gs-gradient-soft border-b border-[var(--border)] py-5">
        <div className="mx-auto max-w-6xl px-4">
          <ServiceTabs places={places} initialTab="vehicles" lang={lang} />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Book Hiace</h1>
            <p className="text-sm text-[var(--muted)]">
              {pickup || "Any pickup"} {oneWay && drop ? `→ ${drop}` : ""} · {days} day(s) · {vehicles.length} vehicles
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {[["", "All"], ["CAR", "Car"], ["JEEP_4WD", "Jeep"], ["VAN", "Van"]].map(([k, label]) => (
              <Link key={k} href={`/vehicles?${qs({ cat: k })}`} className={`gs-chip ${cat === k ? "gs-gradient text-white" : ""}`}>
                {label}
              </Link>
            ))}
            <span className="ml-2 text-[var(--muted)]">Sort:</span>
            {[["price", "Price"], ["seats", "Seats"]].map(([k, label]) => (
              <Link key={k} href={`/vehicles?${qs({ sort: k })}`} className={`gs-chip ${sort === k ? "gs-gradient text-white" : ""}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <div key={v.id} className="gs-card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.coverImage?.url || ""} alt={v.model} className="h-44 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{v.model}</h3>
                  <span className="gs-chip">{CAT_LABEL[v.category]}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1"><Users size={12} /> {v.seats} seats</span>
                  <span className="flex items-center gap-1"><Cog size={12} /> {v.transmission}</span>
                  <span className="flex items-center gap-1"><Gauge size={12} /> {v.driveType}</span>
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">{v.mileagePolicy} · Deposit {npr(v.deposit)}</p>
                {v.pickupPlace && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted)]">
                    <MapPin size={12} /> Pickup: {v.pickupPlace.nameEn}
                  </p>
                )}
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-lg font-extrabold gs-text-gradient">{npr(v.pricePerDay)}</div>
                    <div className="text-xs text-[var(--muted)]">/ day · {npr(v.pricePerDay * days)} total</div>
                  </div>
                  <Link
                    href={`/vehicles/${v.id}?pickupDate=${pickupDate}&returnDate=${returnDate}&oneWay=${oneWay ? "1" : ""}&drop=${encodeURIComponent(drop)}`}
                    className="gs-btn gs-btn-primary text-sm"
                  >
                    Select
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
