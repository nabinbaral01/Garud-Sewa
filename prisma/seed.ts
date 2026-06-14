import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type PlaceSeed = { en: string; ne: string; type?: string };

const PLACES: Record<string, PlaceSeed[]> = {
  Jhapa: [
    { en: "Birtamod", ne: "बिर्तामोड", type: "bus_park" },
    { en: "Charali", ne: "चारआली", type: "bus_park" },
    { en: "Damak", ne: "दमक" },
    { en: "Kakarbhitta", ne: "काँकडभिट्टा", type: "bus_park" },
    { en: "Bhadrapur", ne: "भद्रपुर" },
    { en: "Mechinagar", ne: "मेचीनगर" },
    { en: "Dharampur", ne: "धरमपुर" },
    { en: "Gauradaha", ne: "गौरादह" },
    { en: "Surunga", ne: "सुरुङ्गा" },
    { en: "Shanischare", ne: "शनिश्चरे" },
    { en: "Topgachhi", ne: "टोपगाछी" },
    { en: "Anarmani", ne: "अनारमनी" },
  ],
  Ilam: [
    { en: "Ilam Bazaar", ne: "इलाम बजार", type: "bus_park" },
    { en: "Phikkal", ne: "फिक्कल" },
    { en: "Kanyam", ne: "कन्याम" },
    { en: "Mai Pokhari", ne: "माई पोखरी" },
    { en: "Sandakpur", ne: "सन्दकपुर" },
    { en: "Chulachuli", ne: "चुलाचुली" },
    { en: "Deumai", ne: "देउमाई" },
    { en: "Suryodaya", ne: "सूर्योदय" },
    { en: "Maijogmai", ne: "माईजोगमाई" },
    { en: "Mangsebung", ne: "माङसेबुङ" },
    { en: "Rong", ne: "रोङ" },
  ],
  Panchthar: [
    { en: "Phidim", ne: "फिदिम", type: "bus_park" },
    { en: "Phalelung", ne: "फालेलुङ" },
    { en: "Hilihang", ne: "हिलिहाङ" },
    { en: "Kummayak", ne: "कुम्मायक" },
    { en: "Miklajung", ne: "मिक्लाजुङ" },
    { en: "Phalgunanda", ne: "फाल्गुनन्द" },
    { en: "Tumbewa", ne: "तुम्बेवा" },
    { en: "Yangwarak", ne: "याङवरक" },
    { en: "Falaicha", ne: "फलैँचा" },
    { en: "Yasok", ne: "यासोक" },
  ],
  Taplejung: [
    { en: "Rake", ne: "राके" },
    { en: "Phungling", ne: "फुङलिङ", type: "bus_park" },
    { en: "Suketar", ne: "सुकेटार", type: "airport" },
    { en: "Pathibhara", ne: "पाथीभरा", type: "temple" },
    { en: "Sirijangha", ne: "सिरिजङ्घा" },
    { en: "Sidingwa", ne: "सिदिङवा" },
    { en: "Maiwakhola", ne: "मैवाखोला" },
    { en: "Mikkwakhola", ne: "मिक्क्वाखोला" },
    { en: "Meringden", ne: "मेरिङदेन" },
    { en: "Aathrai Tribeni", ne: "आठराई त्रिवेणी" },
    { en: "Phaktanglung", ne: "फक्ताङलुङ" },
    { en: "Olangchung Gola", ne: "ओलाङचुङ गोला" },
    { en: "Ghunsa", ne: "घुन्सा" },
    { en: "Lelep", ne: "लेलेप" },
  ],
};

const IMG = {
  busHero:
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=70&auto=format&fit=crop",
  bus: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=70&auto=format&fit=crop",
  hotel1:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=70&auto=format&fit=crop",
  hotel2:
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1000&q=70&auto=format&fit=crop",
  hotel3:
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1000&q=70&auto=format&fit=crop",
  room: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=70&auto=format&fit=crop",
  jeep: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&q=70&auto=format&fit=crop",
  car: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=70&auto=format&fit=crop",
  van: "https://images.unsplash.com/photo-1559273514-468f2c9cdb22?w=900&q=70&auto=format&fit=crop",
  banner1:
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=70&auto=format&fit=crop",
  banner2:
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=70&auto=format&fit=crop",
};

async function media(url: string, alt: string) {
  return prisma.mediaAsset.create({
    data: { filename: url.split("/").pop()?.split("?")[0] || "image.jpg", url, alt },
  });
}

async function main() {
  console.log("Resetting data…");
  // wipe in FK-safe order
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.hotelImage.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.vehicleImage.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.route.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.place.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.user.deleteMany();

  // ---- Admin ----
  const email = (process.env.ADMIN_EMAIL || "admin@gadursewa.com").toLowerCase();
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "gadur123", 10);
  await prisma.adminUser.create({
    data: { email, name: "Super Admin", passwordHash, role: "SUPER_ADMIN" },
  });
  console.log("Admin:", email);

  // ---- Places ----
  const placeId: Record<string, string> = {};
  let order = 0;
  for (const [district, list] of Object.entries(PLACES)) {
    for (const p of list) {
      const created = await prisma.place.create({
        data: { nameEn: p.en, nameNe: p.ne, district, type: p.type || "city", sortOrder: order++ },
      });
      placeId[p.en] = created.id;
    }
  }
  console.log(`Places: ${order}`);

  // ---- Route (canonical corridor) ----
  const corridor = ["Birtamod", "Ilam Bazaar", "Phidim", "Phungling"];
  await prisma.route.create({
    data: {
      fromId: placeId["Birtamod"],
      toId: placeId["Phungling"],
      distanceKm: 227,
      durationMin: 540,
      services: "BUS,VEHICLE",
      stops: JSON.stringify(corridor.map((c) => placeId[c])),
    },
  });

  // ---- Operators ----
  const opLogo = await media(IMG.bus, "Operator logo");
  const ops = await Promise.all(
    ["Mechi Yatayat", "Kanchanjunga Deluxe", "Pathibhara Travels", "Ilam Express"].map((name, i) =>
      prisma.operator.create({
        data: { name, contact: "+977 980000000" + i, rating: 4 + (i % 5) * 0.2, logoId: opLogo.id },
      })
    )
  );

  // ---- Buses ----
  const busDefs = [
    { from: "Birtamod", to: "Phungling", type: "AC", depart: "06:30", arrive: "15:30", board: "Birtamod Bus Park", drop: "Phungling Bazaar", fare: 1400, amen: "AC,WiFi,Water,Charging" },
    { from: "Charali", to: "Phungling", type: "Deluxe", depart: "07:00", arrive: "16:30", board: "Charali Chowk", drop: "Phungling Bazaar", fare: 1200, amen: "Reclining,Water,Charging" },
    { from: "Birtamod", to: "Ilam Bazaar", type: "Micro", depart: "08:00", arrive: "11:00", board: "Birtamod Bus Park", drop: "Ilam Bazaar", fare: 600, amen: "Charging" },
    { from: "Phungling", to: "Birtamod", type: "AC", depart: "06:00", arrive: "15:00", board: "Phungling Bazaar", drop: "Birtamod Bus Park", fare: 1400, amen: "AC,WiFi,Water" },
    { from: "Phidim", to: "Phungling", type: "Jeep-Sharing", depart: "09:00", arrive: "13:00", board: "Phidim Bus Park", drop: "Phungling Bazaar", fare: 800, amen: "4WD" },
    { from: "Damak", to: "Phungling", type: "Deluxe", depart: "06:45", arrive: "16:15", board: "Damak Chowk", drop: "Phungling Bazaar", fare: 1300, amen: "Reclining,Water,Blanket" },
  ];
  for (let i = 0; i < busDefs.length; i++) {
    const b = busDefs[i];
    const [dh, dm] = b.depart.split(":").map(Number);
    const [ah, am] = b.arrive.split(":").map(Number);
    const dur = ah * 60 + am - (dh * 60 + dm);
    // Hiace heading to Phungling also pick up/drop at corridor stops (incl. Rake)
    const stops =
      b.to === "Phungling"
        ? JSON.stringify([
            { name: b.from, fare: 0 },
            { name: "Ilam Bazaar", fare: Math.round(b.fare * 0.42) },
            { name: "Phidim", fare: Math.round(b.fare * 0.7) },
            { name: "Rake", fare: Math.round(b.fare * 0.85) },
            { name: "Phungling", fare: b.fare },
          ])
        : "[]";
    await prisma.bus.create({
      data: {
        operatorId: ops[i % ops.length].id,
        fromPlaceId: placeId[b.from],
        toPlaceId: placeId[b.to],
        busType: b.type,
        departTime: b.depart,
        arriveTime: b.arrive,
        boardingPoint: b.board,
        dropPoint: b.drop,
        durationMin: dur,
        totalSeats: 13,
        seatLayout: "hiace",
        amenities: b.amen,
        baseFare: b.fare,
        stops,
        rating: 4 + (i % 5) * 0.15,
      },
    });
  }
  console.log(`Buses: ${busDefs.length}`);

  // ---- Hotels ----
  const hotelDefs = [
    { name: "Hotel Pathibhara Inn", place: "Phungling", badge: "Comfort", stars: 3, img: IMG.hotel1, desc: "Cosy stay in the heart of Phungling with mountain views toward Pathibhara." },
    { name: "Kanchanjunga View Resort", place: "Ilam Bazaar", badge: "Premium", stars: 4, img: IMG.hotel2, desc: "Tea-garden resort overlooking the Ilam hills." },
    { name: "Birtamod Grand Hotel", place: "Birtamod", badge: "Premium", stars: 4, img: IMG.hotel3, desc: "Modern business hotel near Birtamod bus park." },
    { name: "Phidim Hill Homestay", place: "Phidim", badge: "Budget", stars: 2, img: IMG.hotel1, desc: "Warm family homestay with local Limbu cuisine." },
  ];
  for (const h of hotelDefs) {
    const cover = await media(h.img, h.name);
    const hotel = await prisma.hotel.create({
      data: {
        name: h.name,
        placeId: placeId[h.place],
        address: `${h.place}, Eastern Nepal`,
        starRating: h.stars,
        qualityBadge: h.badge,
        descEn: h.desc,
        amenities: "Free WiFi,Parking,Restaurant,Hot water,Room service",
        coverImageId: cover.id,
      },
    });
    await prisma.hotelImage.createMany({
      data: [
        { hotelId: hotel.id, mediaId: cover.id, sortOrder: 0 },
        { hotelId: hotel.id, mediaId: (await media(IMG.room, h.name + " room")).id, sortOrder: 1 },
      ],
    });
    await prisma.roomType.createMany({
      data: [
        { hotelId: hotel.id, name: "Standard Double", capacity: 2, beds: "1 Double", mealPlan: "Breakfast", pricePerNight: 2500 + h.stars * 500, roomsAvailable: 6 },
        { hotelId: hotel.id, name: "Deluxe Room", capacity: 3, beds: "1 Double + 1 Single", mealPlan: "Breakfast", pricePerNight: 3500 + h.stars * 700, roomsAvailable: 4 },
      ],
    });
  }
  console.log(`Hotels: ${hotelDefs.length}`);

  // ---- Vehicles ----
  const vehDefs = [
    { model: "Mahindra Bolero", cat: "JEEP_4WD", seats: 7, img: IMG.jeep, price: 9000, drive: "4WD" },
    { model: "Mahindra Scorpio", cat: "JEEP_4WD", seats: 7, img: IMG.jeep, price: 11000, drive: "4WD" },
    { model: "Tata Sumo", cat: "JEEP_4WD", seats: 9, img: IMG.jeep, price: 8500, drive: "4WD" },
    { model: "Toyota Hiace", cat: "VAN", seats: 12, img: IMG.van, price: 13000, drive: "2WD" },
    { model: "Hyundai i20", cat: "CAR", seats: 4, img: IMG.car, price: 6000, drive: "2WD" },
  ];
  for (const v of vehDefs) {
    const cover = await media(v.img, v.model);
    const vehicle = await prisma.vehicle.create({
      data: {
        model: v.model,
        category: v.cat,
        seats: v.seats,
        driveType: v.drive,
        transmission: v.cat === "CAR" ? "Automatic" : "Manual",
        pricePerDay: v.price,
        deposit: 10000,
        pickupPlaceId: placeId["Birtamod"],
        coverImageId: cover.id,
      },
    });
    await prisma.vehicleImage.create({ data: { vehicleId: vehicle.id, mediaId: cover.id, sortOrder: 0 } });
  }
  console.log(`Vehicles: ${vehDefs.length}`);

  // ---- Banners ----
  const b1 = await media(IMG.banner1, "Banner 1");
  const b2 = await media(IMG.banner2, "Banner 2");
  await prisma.banner.createMany({
    data: [
      { title: "Discover Taplejung", subtitle: "Buses, hotels & jeeps to Phungling and Pathibhara", imageId: b1.id, sortOrder: 0 },
      { title: "Ilam Tea Gardens", subtitle: "Weekend getaways with 10% off — use TEA10", imageId: b2.id, promoCode: "TEA10", sortOrder: 1 },
    ],
  });

  // ---- Coupons ----
  await prisma.coupon.createMany({
    data: [
      { code: "TEA10", discountType: "PERCENT", value: 10 },
      { code: "GADUR500", discountType: "FLAT", value: 500 },
    ],
  });

  console.log("Seed complete ✔");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
