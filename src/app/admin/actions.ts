"use server";

import { prisma } from "@/lib/db";
import { login, logout, requireAdmin, requireSuperAdmin, hashPassword } from "@/lib/auth";
import { setSetting, DEFAULT_SETTINGS } from "@/lib/settings";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const n = (fd: FormData, k: string, d = 0) => {
  const v = Number(fd.get(k));
  return Number.isFinite(v) ? v : d;
};
const b = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "1" || fd.get(k) === "true";
const opt = (v: string) => (v === "" ? null : v);

// --------------------------- Auth -----------------------------------------

export async function loginAction(fd: FormData) {
  const email = s(fd, "email");
  const password = s(fd, "password");
  const session = await login(email, password);
  if (!session) redirect("/admin/login?error=1");
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

// --------------------------- Places ---------------------------------------

export async function upsertPlace(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const data = {
    nameEn: s(fd, "nameEn"),
    nameNe: s(fd, "nameNe"),
    district: s(fd, "district"),
    type: s(fd, "type") || "city",
    lat: fd.get("lat") ? n(fd, "lat") : null,
    lng: fd.get("lng") ? n(fd, "lng") : null,
    sortOrder: n(fd, "sortOrder"),
  };
  if (id) {
    await prisma.place.update({ where: { id }, data });
  } else {
    // new places go to the end of the corridor (avoid colliding at position 0)
    if (!fd.get("sortOrder") || data.sortOrder === 0) {
      const last = await prisma.place.findFirst({ orderBy: { sortOrder: "desc" } });
      data.sortOrder = (last?.sortOrder ?? 0) + 1;
    }
    await prisma.place.create({ data });
  }
  revalidatePath("/admin/places");
  redirect("/admin/places");
}

export async function deletePlace(fd: FormData) {
  await requireAdmin();
  let inUse = false;
  try {
    await prisma.place.delete({ where: { id: s(fd, "id") } });
  } catch {
    inUse = true; // referenced by a bus / hotel / vehicle / route
  }
  revalidatePath("/admin/places");
  if (inUse) redirect("/admin/places?error=inuse");
}

// Set a place's exact position (1-based) in corridor order; re-sequences all
// places to unique values so there are no ties.
export async function setPlaceOrder(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  let pos = n(fd, "position");
  const all = await prisma.place.findMany({ orderBy: { sortOrder: "asc" } });
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return;
  const [moved] = all.splice(idx, 1);
  pos = Math.max(1, Math.min(all.length + 1, pos));
  all.splice(pos - 1, 0, moved);
  await prisma.$transaction(all.map((p, i) => prisma.place.update({ where: { id: p.id }, data: { sortOrder: i } })));
  revalidatePath("/admin/places");
}

// Swap a place with its neighbour in corridor order (used by fares & seat collisions).
export async function movePlace(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const dir = s(fd, "dir"); // "up" | "down"
  const all = await prisma.place.findMany({ orderBy: { sortOrder: "asc" } });
  const i = all.findIndex((p) => p.id === id);
  if (i < 0) return;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= all.length) return;
  const a = all[i];
  const b = all[j];
  await prisma.$transaction([
    prisma.place.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.place.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidatePath("/admin/places");
}

export async function bulkDeletePlaces(fd: FormData) {
  await requireAdmin();
  const ids = String(fd.get("ids") || "").split(",").map((x) => x.trim()).filter(Boolean);
  let failed = 0;
  for (const id of ids) {
    try {
      await prisma.place.delete({ where: { id } });
    } catch {
      failed++; // in use — skipped
    }
  }
  revalidatePath("/admin/places");
  redirect(failed ? "/admin/places?error=inuse" : "/admin/places?deleted=1");
}

// Generic bulk delete for simple listing tables.
const BULK_PATHS: Record<string, string> = {
  place: "/admin/places",
  operator: "/admin/operators",
  bus: "/admin/buses",
  hotel: "/admin/hotels",
  vehicle: "/admin/vehicles",
  coupon: "/admin/coupons",
  banner: "/admin/banners",
};

export async function bulkDelete(fd: FormData) {
  await requireAdmin();
  const model = String(fd.get("model"));
  const path = BULK_PATHS[model];
  if (!path) redirect("/admin");
  const ids = String(fd.get("ids") || "").split(",").map((x) => x.trim()).filter(Boolean);
  const delegate = (prisma as unknown as Record<string, { delete: (a: { where: { id: string } }) => Promise<unknown> }>)[model];
  let failed = 0;
  for (const id of ids) {
    try {
      await delegate.delete({ where: { id } });
    } catch {
      failed++; // referenced elsewhere — skipped
    }
  }
  revalidatePath(path);
  redirect(failed ? `${path}?error=inuse` : `${path}?deleted=1`);
}

// --------------------------- Routes ---------------------------------------

export async function upsertRoute(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const data = {
    fromId: s(fd, "fromId"),
    toId: s(fd, "toId"),
    distanceKm: n(fd, "distanceKm"),
    durationMin: n(fd, "durationMin"),
    services: s(fd, "services") || "BUS",
    active: b(fd, "active"),
  };
  if (id) await prisma.route.update({ where: { id }, data });
  else await prisma.route.create({ data });
  revalidatePath("/admin/routes");
  redirect("/admin/routes");
}

export async function deleteRoute(fd: FormData) {
  await requireAdmin();
  await prisma.route.delete({ where: { id: s(fd, "id") } });
  revalidatePath("/admin/routes");
}

// --------------------------- Operators ------------------------------------

export async function upsertOperator(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const data = {
    name: s(fd, "name"),
    contact: opt(s(fd, "contact")),
    rating: n(fd, "rating", 4),
    logoId: opt(s(fd, "logoId")),
  };
  if (id) await prisma.operator.update({ where: { id }, data });
  else await prisma.operator.create({ data });
  revalidatePath("/admin/operators");
  redirect("/admin/operators");
}

export async function deleteOperator(fd: FormData) {
  await requireAdmin();
  await prisma.operator.delete({ where: { id: s(fd, "id") } });
  revalidatePath("/admin/operators");
}

// --------------------------- Buses ----------------------------------------

export async function upsertBus(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const [dh, dm] = s(fd, "departTime").split(":").map(Number);
  const [ah, am] = s(fd, "arriveTime").split(":").map(Number);
  const dur = ah * 60 + am - (dh * 60 + dm);
  const data = {
    operatorId: s(fd, "operatorId"),
    fromPlaceId: s(fd, "fromPlaceId"),
    toPlaceId: s(fd, "toPlaceId"),
    busType: s(fd, "busType") || "Deluxe",
    departTime: s(fd, "departTime"),
    arriveTime: s(fd, "arriveTime"),
    boardingPoint: s(fd, "boardingPoint"),
    dropPoint: s(fd, "dropPoint"),
    durationMin: dur > 0 ? dur : 0,
    totalSeats: n(fd, "totalSeats", 35),
    seatLayout: s(fd, "seatLayout") || "2-2",
    amenities: s(fd, "amenities"),
    vehicleNumber: opt(s(fd, "vehicleNumber")),
    baseFare: n(fd, "baseFare"),
    stops: s(fd, "stops") || "[]",
    rating: n(fd, "rating", 4),
    status: s(fd, "status") || "active",
  };
  if (data.fromPlaceId === data.toPlaceId) redirect("/admin/buses?error=samestop");
  if (id) {
    await prisma.bus.update({ where: { id }, data });
    revalidatePath("/admin/buses");
    redirect("/admin/buses");
  }
  // new Hiace → reopen in edit mode so photos can be added right away
  const created = await prisma.bus.create({ data });
  revalidatePath("/admin/buses");
  redirect(`/admin/buses?edit=${created.id}`);
}

export async function deleteBus(fd: FormData) {
  await requireAdmin();
  await prisma.bus.delete({ where: { id: s(fd, "id") } });
  revalidatePath("/admin/buses");
}

export async function addBusImage(fd: FormData) {
  await requireAdmin();
  const busId = s(fd, "busId");
  await prisma.busImage.create({ data: { busId, mediaId: s(fd, "mediaId"), sortOrder: n(fd, "sortOrder") } });
  revalidatePath("/admin/buses");
}

export async function removeBusImage(fd: FormData) {
  await requireAdmin();
  await prisma.busImage.delete({ where: { id: s(fd, "id") } });
  revalidatePath("/admin/buses");
}

// --------------------------- Hotels ---------------------------------------

export async function upsertHotel(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const data = {
    name: s(fd, "name"),
    placeId: s(fd, "placeId"),
    address: opt(s(fd, "address")),
    starRating: n(fd, "starRating", 3),
    qualityBadge: s(fd, "qualityBadge") || "Comfort",
    descEn: s(fd, "descEn"),
    descNe: s(fd, "descNe"),
    amenities: s(fd, "amenities"),
    checkInTime: s(fd, "checkInTime") || "13:00",
    checkOutTime: s(fd, "checkOutTime") || "11:00",
    cancellation: s(fd, "cancellation"),
    coverImageId: opt(s(fd, "coverImageId")),
    status: s(fd, "status") || "active",
  };
  if (id) await prisma.hotel.update({ where: { id }, data });
  else await prisma.hotel.create({ data });
  revalidatePath("/admin/hotels");
  redirect("/admin/hotels");
}

export async function deleteHotel(fd: FormData) {
  await requireAdmin();
  await prisma.hotel.delete({ where: { id: s(fd, "id") } });
  revalidatePath("/admin/hotels");
}

export async function upsertRoom(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const data = {
    hotelId: s(fd, "hotelId"),
    name: s(fd, "name"),
    capacity: n(fd, "capacity", 2),
    beds: s(fd, "beds"),
    mealPlan: s(fd, "mealPlan") || "Room only",
    pricePerNight: n(fd, "pricePerNight"),
    roomsAvailable: n(fd, "roomsAvailable", 1),
  };
  if (id) await prisma.roomType.update({ where: { id }, data });
  else await prisma.roomType.create({ data });
  revalidatePath(`/admin/hotels/${data.hotelId}`);
  redirect(`/admin/hotels/${data.hotelId}`);
}

export async function deleteRoom(fd: FormData) {
  await requireAdmin();
  const hotelId = s(fd, "hotelId");
  await prisma.roomType.delete({ where: { id: s(fd, "id") } });
  revalidatePath(`/admin/hotels/${hotelId}`);
}

export async function addHotelImage(fd: FormData) {
  await requireAdmin();
  const hotelId = s(fd, "hotelId");
  await prisma.hotelImage.create({ data: { hotelId, mediaId: s(fd, "mediaId"), sortOrder: n(fd, "sortOrder") } });
  revalidatePath(`/admin/hotels/${hotelId}`);
}

export async function removeHotelImage(fd: FormData) {
  await requireAdmin();
  const hotelId = s(fd, "hotelId");
  await prisma.hotelImage.delete({ where: { id: s(fd, "id") } });
  revalidatePath(`/admin/hotels/${hotelId}`);
}

// --------------------------- Vehicles -------------------------------------

export async function upsertVehicle(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const data = {
    model: s(fd, "model"),
    category: s(fd, "category") || "JEEP_4WD",
    seats: n(fd, "seats", 7),
    transmission: s(fd, "transmission") || "Manual",
    driveType: s(fd, "driveType") || "4WD",
    mileagePolicy: s(fd, "mileagePolicy"),
    deposit: n(fd, "deposit", 10000),
    pricePerDay: n(fd, "pricePerDay"),
    pickupPlaceId: opt(s(fd, "pickupPlaceId")),
    withDriver: b(fd, "withDriver"),
    selfDrive: b(fd, "selfDrive"),
    coverImageId: opt(s(fd, "coverImageId")),
    status: s(fd, "status") || "active",
  };
  if (id) await prisma.vehicle.update({ where: { id }, data });
  else await prisma.vehicle.create({ data });
  revalidatePath("/admin/vehicles");
  redirect("/admin/vehicles");
}

export async function deleteVehicle(fd: FormData) {
  await requireAdmin();
  await prisma.vehicle.delete({ where: { id: s(fd, "id") } });
  revalidatePath("/admin/vehicles");
}

// --------------------------- Bookings -------------------------------------

export async function updateBookingStatus(fd: FormData) {
  await requireAdmin();
  await prisma.booking.update({
    where: { id: s(fd, "id") },
    data: { status: s(fd, "status"), notes: opt(s(fd, "notes")) },
  });
  revalidatePath("/admin/bookings");
}

export async function softDeleteBooking(fd: FormData) {
  await requireAdmin();
  await prisma.booking.update({ where: { id: s(fd, "id") }, data: { deleted: true } });
  revalidatePath("/admin/bookings");
}

export async function restoreBooking(fd: FormData) {
  await requireAdmin();
  await prisma.booking.update({ where: { id: s(fd, "id") }, data: { deleted: false } });
  revalidatePath("/admin/bookings");
}

export async function purgeBooking(fd: FormData) {
  await requireSuperAdmin();
  await prisma.booking.delete({ where: { id: s(fd, "id") } });
  revalidatePath("/admin/bookings");
}

function bookingIds(fd: FormData) {
  return String(fd.get("ids") || "").split(",").map((x) => x.trim()).filter(Boolean);
}

export async function bulkBinBookings(fd: FormData) {
  await requireAdmin();
  await prisma.booking.updateMany({ where: { id: { in: bookingIds(fd) } }, data: { deleted: true } });
  revalidatePath("/admin/bookings");
}

export async function bulkRestoreBookings(fd: FormData) {
  await requireAdmin();
  await prisma.booking.updateMany({ where: { id: { in: bookingIds(fd) } }, data: { deleted: false } });
  revalidatePath("/admin/bookings");
}

export async function bulkPurgeBookings(fd: FormData) {
  await requireSuperAdmin();
  await prisma.booking.deleteMany({ where: { id: { in: bookingIds(fd) } } });
  revalidatePath("/admin/bookings");
}

// --------------------------- Users ----------------------------------------

export async function toggleUser(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const u = await prisma.user.findUnique({ where: { id } });
  if (u) await prisma.user.update({ where: { id }, data: { active: !u.active } });
  revalidatePath("/admin/users");
}

// --------------------------- Banners --------------------------------------

export async function upsertBanner(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const data = {
    title: s(fd, "title"),
    subtitle: s(fd, "subtitle"),
    imageId: opt(s(fd, "imageId")),
    link: s(fd, "link"),
    promoCode: opt(s(fd, "promoCode")),
    sortOrder: n(fd, "sortOrder"),
    active: b(fd, "active"),
  };
  if (id) await prisma.banner.update({ where: { id }, data });
  else await prisma.banner.create({ data });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  redirect("/admin/banners");
}

export async function deleteBanner(fd: FormData) {
  await requireAdmin();
  await prisma.banner.delete({ where: { id: s(fd, "id") } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

// --------------------------- Coupons --------------------------------------

export async function upsertCoupon(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const data = {
    code: s(fd, "code").toUpperCase(),
    discountType: s(fd, "discountType") || "PERCENT",
    value: n(fd, "value"),
    active: b(fd, "active"),
    expiresAt: fd.get("expiresAt") ? new Date(s(fd, "expiresAt")) : null,
  };
  if (id) await prisma.coupon.update({ where: { id }, data });
  else await prisma.coupon.create({ data });
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function deleteCoupon(fd: FormData) {
  await requireAdmin();
  await prisma.coupon.delete({ where: { id: s(fd, "id") } });
  revalidatePath("/admin/coupons");
}

// --------------------------- Settings -------------------------------------

export async function saveSettings(fd: FormData) {
  await requireSuperAdmin();
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    await setSetting(key, String(fd.get(key) ?? ""));
  }
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

// --------------------------- Media ----------------------------------------

export async function addMediaByUrl(fd: FormData) {
  await requireAdmin();
  const url = s(fd, "url");
  if (url) {
    await prisma.mediaAsset.create({
      data: { url, filename: url.split("/").pop()?.split("?")[0] || "image", alt: s(fd, "alt") },
    });
  }
  revalidatePath("/admin/media");
}

export async function deleteMedia(fd: FormData) {
  await requireAdmin();
  await prisma.mediaAsset.delete({ where: { id: s(fd, "id") } });
  revalidatePath("/admin/media");
}

// --------------------------- Staff ----------------------------------------

export async function upsertStaff(fd: FormData) {
  await requireSuperAdmin();
  const id = s(fd, "id");
  const email = s(fd, "email").toLowerCase();
  const name = s(fd, "name");
  const role = s(fd, "role") || "EDITOR";
  const password = s(fd, "password");
  if (id) {
    const data: { email: string; name: string; role: string; active: boolean; passwordHash?: string } = {
      email,
      name,
      role,
      active: b(fd, "active"),
    };
    if (password) data.passwordHash = await hashPassword(password);
    await prisma.adminUser.update({ where: { id }, data });
  } else {
    await prisma.adminUser.create({
      data: { email, name, role, passwordHash: await hashPassword(password || "changeme123") },
    });
  }
  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function deleteStaff(fd: FormData) {
  const me = await requireSuperAdmin();
  const id = s(fd, "id");
  if (id === me.id) redirect("/admin/staff?error=self");
  await prisma.adminUser.delete({ where: { id } });
  revalidatePath("/admin/staff");
}
