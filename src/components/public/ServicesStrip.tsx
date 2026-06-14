import Link from "next/link";
import { Bus, BedDouble, Car, Plane, Palmtree, Mountain } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

type Service = { tkey: string; icon: React.ReactNode; href?: string };

const SERVICES: Service[] = [
  { tkey: "buses", icon: <Bus size={22} />, href: "/buses" },
  { tkey: "hotels", icon: <BedDouble size={22} />, href: "/hotels" },
  { tkey: "carJeep", icon: <Car size={22} />, href: "/vehicles" },
  { tkey: "flights", icon: <Plane size={22} /> },
  { tkey: "tours", icon: <Palmtree size={22} /> },
  { tkey: "trekking", icon: <Mountain size={22} /> },
];

export default function ServicesStrip({ lang = "en" }: { lang?: Lang }) {
  return (
    <section className="mx-auto mt-12 max-w-6xl px-4">
      <h2 className="mb-4 text-xl font-bold">{t(lang, "exploreServices")}</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {SERVICES.map((s) => {
          const inner = (
            <div className="gs-card flex h-full flex-col items-center gap-2 p-4 text-center transition hover:shadow-md hover:-translate-y-0.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-gsviolet">
                {s.icon}
              </span>
              <span className="text-sm font-semibold">{t(lang, s.tkey)}</span>
              {!s.href && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-700">
                  {t(lang, "soon")}
                </span>
              )}
            </div>
          );
          return s.href ? (
            <Link key={s.tkey} href={s.href}>
              {inner}
            </Link>
          ) : (
            <div key={s.tkey} className="cursor-default opacity-75">
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
