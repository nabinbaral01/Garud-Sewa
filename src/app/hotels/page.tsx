import Link from "next/link";
import { Star, MapPin, BedDouble } from "lucide-react";
import TopBar from "@/components/public/TopBar";
import Footer from "@/components/public/Footer";
import ServiceTabs from "@/components/public/ServiceTabs";
import { getPlaceOptions } from "@/lib/places";
import { getLang } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { npr, csv, isoDate, addDays, nightsBetween } from "@/lib/format";

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const city = sp.city || "";
  const checkIn = sp.checkIn || isoDate(new Date());
  const checkOut = sp.checkOut || isoDate(addDays(new Date(), 1));
  const guests = sp.guests || "2";
  const rooms = sp.rooms || "1";
  const nights = nightsBetween(new Date(checkIn), new Date(checkOut));

  const [places, lang] = await Promise.all([getPlaceOptions(), getLang()]);
  let hotels = await prisma.hotel.findMany({
    where: { status: "active" },
    include: { place: true, coverImage: true, rooms: { orderBy: { pricePerNight: "asc" } } },
  });
  if (city) {
    const c = city.toLowerCase();
    hotels = hotels.filter(
      (h) => h.place.nameEn.toLowerCase().includes(c) || h.name.toLowerCase().includes(c) || h.place.district.toLowerCase().includes(c)
    );
  }

  return (
    <>
      <TopBar />
      <div className="gs-gradient-soft border-b border-[var(--border)] py-5">
        <div className="mx-auto max-w-6xl px-4">
          <ServiceTabs places={places} initialTab="hotels" lang={lang} />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-1 text-xl font-bold">{city ? `Hotels in ${city}` : "All hotels"}</h1>
        <p className="mb-4 text-sm text-[var(--muted)]">
          {hotels.length} stay(s) · {nights} night(s) · {guests} guest(s) · {rooms} room(s)
        </p>

        {hotels.length === 0 ? (
          <div className="gs-card p-10 text-center text-[var(--muted)]">No hotels match your search.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {hotels.map((h) => {
              const cheapest = h.rooms[0]?.pricePerNight ?? 0;
              return (
                <div key={h.id} className="gs-card overflow-hidden">
                  <div className="relative h-48">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.coverImage?.url || ""} alt={h.name} className="h-full w-full object-cover" />
                    <span className="gs-chip absolute left-3 top-3 bg-white">{h.qualityBadge}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold">{h.name}</h3>
                      <span className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: h.starRating }).map((_, i) => (
                          <Star key={i} size={12} fill="currentColor" />
                        ))}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted)]">
                      <MapPin size={12} /> {h.place.nameEn}, {h.place.district}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {csv(h.amenities).slice(0, 3).map((a) => (
                        <span key={a} className="text-[0.7rem] text-[var(--muted)]">• {a}</span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <div className="text-xs text-[var(--muted)]">From / night</div>
                        <div className="text-lg font-extrabold gs-text-gradient">{npr(cheapest)}</div>
                        <div className="text-xs text-[var(--muted)]">{npr(cheapest * nights)} for {nights} night(s)</div>
                      </div>
                      <Link
                        href={`/hotels/${h.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`}
                        className="gs-btn gs-btn-primary text-sm"
                      >
                        <BedDouble size={15} /> Select room
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
