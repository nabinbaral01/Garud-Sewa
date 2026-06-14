import Link from "next/link";
import { Star, Wifi, Snowflake, Zap, Droplet, ArrowRight } from "lucide-react";
import TopBar from "@/components/public/TopBar";
import Footer from "@/components/public/Footer";
import ServiceTabs from "@/components/public/ServiceTabs";
import { getPlaceOptions } from "@/lib/places";
import { getLang } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { npr, fmtTime, fmtDuration, csv, isoDate } from "@/lib/format";
import { effectiveStops, segmentFare, stopTime } from "@/lib/stops";

const AMENITY_ICON: Record<string, React.ReactNode> = {
  WiFi: <Wifi size={13} />,
  AC: <Snowflake size={13} />,
  Charging: <Zap size={13} />,
  Water: <Droplet size={13} />,
};

export default async function BusesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const from = sp.from || "";
  const to = sp.to || "";
  const date = sp.date || isoDate(new Date());
  const pax = sp.passengers || "1";
  const sort = sp.sort || "time";

  const [places, lang] = await Promise.all([getPlaceOptions(), getLang()]);
  const allBuses = await prisma.bus.findMany({
    where: { status: "active" },
    include: { operator: true, fromPlace: true, toPlace: true },
  });

  // Augment each Hiace with the searched segment (so intermediate stops like
  // "Rake" match a Hiace that's continuing to Phungling).
  let buses = allBuses.map((b) => {
    const stops = effectiveStops(b.stops, b.fromPlace.nameEn, b.toPlace.nameEn, b.baseFare, b.departTime, b.arriveTime);
    let segFrom = b.fromPlace.nameEn;
    let segTo = b.toPlace.nameEn;
    let fare = b.baseFare;
    let serves = true;
    if (from || to) {
      const f = from || stops[0].name;
      const t = to || stops[stops.length - 1].name;
      const seg = segmentFare(stops, f, t);
      if (seg) {
        segFrom = seg.fromName;
        segTo = seg.toName;
        fare = seg.fare;
      } else {
        serves = false;
      }
    }
    const segDepart = stopTime(stops, segFrom) || b.departTime;
    const segArrive = stopTime(stops, segTo) || b.arriveTime;
    return { ...b, segFrom, segTo, fare, serves, segDepart, segArrive };
  }).filter((b) => b.serves);

  buses.sort((a, b) => {
    if (sort === "price") return a.fare - b.fare;
    if (sort === "duration") return a.durationMin - b.durationMin;
    if (sort === "rating") return b.rating - a.rating;
    return a.departTime.localeCompare(b.departTime);
  });

  const qs = (extra: Record<string, string>) =>
    new URLSearchParams({ from, to, date, passengers: pax, sort, ...extra }).toString();

  return (
    <>
      <TopBar />
      <div className="gs-gradient-soft border-b border-[var(--border)] py-5">
        <div className="mx-auto max-w-6xl px-4">
          <ServiceTabs places={places} lang={lang} />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">
              {from || "All"} <ArrowRight size={16} className="inline text-gsviolet" /> {to || "destinations"}
            </h1>
            <p className="text-sm text-[var(--muted)]">
              {buses.length} Hiace · {date}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--muted)]">Sort:</span>
            {[
              ["time", "Time"],
              ["price", "Price"],
              ["duration", "Duration"],
              ["rating", "Rating"],
            ].map(([k, label]) => (
              <Link
                key={k}
                href={`/buses?${qs({ sort: k })}`}
                className={`gs-chip ${sort === k ? "gs-gradient text-white" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {buses.length === 0 ? (
          <div className="gs-card p-10 text-center text-[var(--muted)]">
            No Hiace found for this route. Try other towns along the corridor.
          </div>
        ) : (
          <div className="space-y-3">
            {buses.map((b) => (
              <div key={b.id} className="gs-card p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="md:w-1/4">
                    <div className="font-bold">{b.operator.name}</div>
                    <div className="gs-chip mt-1">{b.busType}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                      <Star size={12} fill="currentColor" /> {b.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="flex flex-1 items-center gap-3">
                    <div>
                      <div className="text-lg font-bold">{fmtTime(b.segDepart)}</div>
                      <div className="text-xs text-[var(--muted)]">{b.segFrom}</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-xs text-[var(--muted)]">{fmtDuration(b.durationMin)}</div>
                      <div className="my-1 h-px bg-[var(--border)]" />
                      <div className="text-[0.7rem] font-semibold text-gsviolet">{b.segFrom} → {b.segTo}</div>
                      {(b.segFrom !== b.fromPlace.nameEn || b.segTo !== b.toPlace.nameEn) && (
                        <div className="text-[0.65rem] text-[var(--muted)]">on the {b.fromPlace.nameEn}–{b.toPlace.nameEn} Hiace</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{fmtTime(b.segArrive)}</div>
                      <div className="text-xs text-[var(--muted)]">{b.segTo}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 md:w-1/5">
                    <div className="text-xl font-extrabold gs-text-gradient">{npr(b.fare)}</div>
                    <Link
                      href={`/buses/${b.id}?date=${date}&from=${encodeURIComponent(b.segFrom)}&to=${encodeURIComponent(b.segTo)}`}
                      className="gs-btn gs-btn-primary text-sm"
                    >
                      Select seats
                    </Link>
                  </div>
                </div>
                {csv(b.amenities).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                    {csv(b.amenities).map((a) => (
                      <span key={a} className="flex items-center gap-1 text-xs text-[var(--muted)]">
                        {AMENITY_ICON[a]} {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
