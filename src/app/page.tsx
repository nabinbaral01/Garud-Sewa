import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TopBar from "@/components/public/TopBar";
import Footer from "@/components/public/Footer";
import ServiceTabs from "@/components/public/ServiceTabs";
import ServicesStrip from "@/components/public/ServicesStrip";
import { getPlaceOptions } from "@/lib/places";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [places, s, banners, lang] = await Promise.all([
    getPlaceOptions(),
    getSettings(),
    prisma.banner.findMany({ where: { active: true }, include: { image: true }, orderBy: { sortOrder: "asc" } }),
    getLang(),
  ]);

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 gs-gradient" />
        {s.heroImage && (
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${s.heroImage})` }} />
        )}
        <div className="relative">
          <TopBar light />
          <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 text-white sm:pt-16">
            <span className="gs-chip bg-white/15 text-white">{s.taglineNe}</span>
            <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">
              {s.heroTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-white/85">{s.heroSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-4">
        <ServiceTabs places={places} lang={lang} />
      </div>

      {/* Services */}
      <ServicesStrip lang={lang} />

      {/* Promotions */}
      {banners.length > 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-4">
          <h2 className="mb-4 text-xl font-bold">{t(lang, "promotions")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {banners.map((b) => (
              <Link key={b.id} href={b.link || "#"} className="group relative overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.image?.url || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1000"}
                  alt={b.title}
                  className="h-44 w-full object-cover transition group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 p-4 text-white">
                  <h3 className="text-lg font-bold">{b.title}</h3>
                  <p className="text-sm text-white/85">{b.subtitle}</p>
                  {b.promoCode && <span className="gs-chip mt-2 bg-white/20 text-white">Code: {b.promoCode}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular routes */}
      <section className="mx-auto mt-12 max-w-6xl px-4">
        <h2 className="mb-4 text-xl font-bold">{t(lang, "popularRoutes")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {[
            ["Birtamod", "Phungling"],
            ["Charali", "Ilam Bazaar"],
            ["Damak", "Phungling"],
            ["Phidim", "Phungling"],
            ["Birtamod", "Ilam Bazaar"],
            ["Kakarbhitta", "Phungling"],
          ].map(([from, to]) => (
            <Link
              key={from + to}
              href={`/buses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
              className="gs-card flex items-center justify-between p-4 hover:shadow-md"
            >
              <span className="font-semibold">
                {from} <ArrowRight size={14} className="mx-1 inline text-gsviolet" /> {to}
              </span>
              <span className="text-xs text-[var(--muted)]">{t(lang, "busesJeeps")}</span>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
