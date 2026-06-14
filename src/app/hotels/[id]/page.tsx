import { notFound } from "next/navigation";
import { Star, MapPin, Clock, ShieldCheck } from "lucide-react";
import TopBar from "@/components/public/TopBar";
import Footer from "@/components/public/Footer";
import HotelBooking from "@/components/public/HotelBooking";
import ReviewsSection from "@/components/public/ReviewsSection";
import { prisma } from "@/lib/db";
import { getCustomer } from "@/lib/customer-auth";
import { getSettings } from "@/lib/settings";
import { csv, isoDate, addDays, nightsBetween } from "@/lib/format";

export default async function HotelDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const checkIn = sp.checkIn || isoDate(new Date());
  const checkOut = sp.checkOut || isoDate(addDays(new Date(), 1));
  const guests = Number(sp.guests || 2);
  const roomsCount = Number(sp.rooms || 1);
  const nights = nightsBetween(new Date(checkIn), new Date(checkOut));

  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: {
      place: true,
      images: { include: { media: true }, orderBy: { sortOrder: "asc" } },
      rooms: { orderBy: { pricePerNight: "asc" } },
    },
  });
  if (!hotel) notFound();
  const customer = await getCustomer();
  const s = await getSettings();
  const payment = { qr: s.paymentQr, merchant: s.paymentMerchant, terminal: s.paymentTerminal, branch: s.paymentBranch };

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{hotel.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-[var(--muted)]">
              <MapPin size={14} /> {hotel.address || hotel.place.nameEn}, {hotel.place.district}
            </p>
          </div>
          <span className="flex items-center gap-0.5 text-amber-500">
            {Array.from({ length: hotel.starRating }).map((_, i) => (
              <Star key={i} size={14} fill="currentColor" />
            ))}
          </span>
        </div>

        {/* gallery */}
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {hotel.images.slice(0, 3).map((im, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={im.id}
              src={im.media.url}
              alt={hotel.name}
              className={`w-full rounded-xl object-cover ${i === 0 ? "h-64 sm:col-span-2 sm:row-span-2" : "h-32"}`}
            />
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <p className="text-sm text-[var(--ink)]">{hotel.descEn}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
              <span className="flex items-center gap-1"><Clock size={14} /> Check-in {hotel.checkInTime} · Check-out {hotel.checkOutTime}</span>
              <span className="flex items-center gap-1"><ShieldCheck size={14} /> {hotel.cancellation}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {csv(hotel.amenities).map((a) => (
                <span key={a} className="gs-chip">{a}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <HotelBooking
            hotelId={hotel.id}
            rooms={hotel.rooms}
            nights={nights}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            roomsCount={roomsCount}
            customer={customer ? { name: customer.name, email: customer.email } : null}
            payment={payment}
          />
        </div>

        <ReviewsSection serviceType="HOTEL" serviceId={hotel.id} />
      </main>
      <Footer />
    </>
  );
}
