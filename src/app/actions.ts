"use server";

import { prisma } from "@/lib/db";
import { bookingRef, nightsBetween, daysBetween } from "@/lib/format";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCustomer } from "@/lib/customer-auth";
import { effectiveStops, segmentFare, seatsConflict, stopIdx } from "@/lib/stops";
import { csv } from "@/lib/format";

function loginRedirect(formData: FormData): never {
  const next = String(formData.get("next") || "/");
  redirect(`/account?tab=login&next=${encodeURIComponent(next)}`);
}

// Returns the discount amount (0 if no/invalid coupon), capped at the subtotal.
async function couponDiscount(code: string | null, subtotal: number): Promise<number> {
  if (!code) return 0;
  const c = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });
  if (!c || !c.active) return 0;
  if (c.expiresAt && c.expiresAt < new Date()) return 0;
  const off = c.discountType === "PERCENT" ? Math.round((subtotal * c.value) / 100) : c.value;
  return Math.min(subtotal, Math.max(0, off));
}

export async function createBusBooking(formData: FormData) {
  const customer = await getCustomer();
  if (!customer) loginRedirect(formData);

  const busId = String(formData.get("busId"));
  const seats = String(formData.get("seats") || "");
  const date = String(formData.get("date"));
  const name = String(formData.get("customerName") || "").trim();
  const phone = String(formData.get("customerPhone") || "").trim();
  const email = String(formData.get("customerEmail") || "").trim();
  const coupon = String(formData.get("coupon") || "").trim();

  if (!busId || !seats || !name || !phone) throw new Error("Missing required fields");

  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    include: { fromPlace: true, toPlace: true },
  });
  if (!bus) throw new Error("Bus not found");

  // recompute the per-seat segment fare server-side (don't trust the client)
  const stops = effectiveStops(bus.stops, bus.fromPlace.nameEn, bus.toPlace.nameEn, bus.baseFare);
  const reqFrom = String(formData.get("boardFrom") || "") || stops[0].name;
  const reqTo = String(formData.get("dropTo") || "") || stops[stops.length - 1].name;
  const seg = segmentFare(stops, reqFrom, reqTo) ?? {
    fare: bus.baseFare,
    fromName: bus.fromPlace.nameEn,
    toName: bus.toPlace.nameEn,
  };

  const seatList = seats.split(",").filter(Boolean);

  // ensure none of the chosen seats are already taken on an OVERLAPPING segment
  const day = new Date(date);
  const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
  const existing = await prisma.booking.findMany({
    where: { busId, deleted: false, travelDate: { gte: dayStart, lte: dayEnd }, status: { not: "CANCELLED" } },
    select: { seats: true, boardFrom: true, dropTo: true },
  });
  // collisions are measured by each stop's position in THIS Hiace's own stop order
  const pos = (name: string) => stopIdx(stops, name);
  const reqLo = pos(seg.fromName);
  const reqHi = pos(seg.toName);
  const taken = new Set<string>();
  for (const e of existing) {
    const f = e.boardFrom ? pos(e.boardFrom) : 0;
    const t = e.dropTo ? pos(e.dropTo) : stops.length - 1;
    if (seatsConflict(reqLo, reqHi, f, t)) for (const s of csv(e.seats)) taken.add(s);
  }
  if (seatList.some((s) => taken.has(s))) {
    const next = String(formData.get("next") || `/buses/${busId}`);
    redirect(`${next}${next.includes("?") ? "&" : "?"}seatTaken=1`);
  }

  const base = seg.fare * seatList.length;
  const discount = await couponDiscount(coupon || null, base);
  const ref = bookingRef("HIA");

  await prisma.booking.create({
    data: {
      ref,
      serviceType: "BUS",
      status: "PENDING",
      customerName: name,
      customerPhone: phone,
      customerEmail: email || null,
      busId,
      travelDate: new Date(date),
      seats,
      passengers: String(formData.get("passengers") || "[]"),
      boardFrom: seg.fromName,
      dropTo: seg.toName,
      subtotal: base,
      discount,
      amount: base - discount,
      couponCode: discount > 0 ? coupon : null,
      userId: customer!.id,
      paymentProof: String(formData.get("paymentProof") || "") || null,
    },
  });
  revalidatePath(`/buses/${busId}`); // refresh the seat map so the booked seats show
  redirect(`/booking-success?ref=${ref}`);
}

export async function createHotelBooking(formData: FormData) {
  const customer = await getCustomer();
  if (!customer) loginRedirect(formData);

  const hotelId = String(formData.get("hotelId"));
  const roomTypeId = String(formData.get("roomTypeId"));
  const checkIn = new Date(String(formData.get("checkIn")));
  const checkOut = new Date(String(formData.get("checkOut")));
  const rooms = Number(formData.get("rooms") || 1);
  const guests = Number(formData.get("guests") || 1);
  const name = String(formData.get("customerName") || "").trim();
  const phone = String(formData.get("customerPhone") || "").trim();
  const email = String(formData.get("customerEmail") || "").trim();
  const coupon = String(formData.get("coupon") || "").trim();

  if (!hotelId || !roomTypeId || !name || !phone) throw new Error("Missing required fields");

  const room = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
  if (!room) throw new Error("Room not found");

  const nights = nightsBetween(checkIn, checkOut);
  const base = room.pricePerNight * nights * rooms;
  const discount = await couponDiscount(coupon || null, base);
  const ref = bookingRef("HTL");

  await prisma.booking.create({
    data: {
      ref,
      serviceType: "HOTEL",
      status: "PENDING",
      customerName: name,
      customerPhone: phone,
      customerEmail: email || null,
      hotelId,
      roomTypeId,
      checkIn,
      checkOut,
      rooms,
      guests,
      subtotal: base,
      discount,
      amount: base - discount,
      couponCode: discount > 0 ? coupon : null,
      userId: customer!.id,
      paymentProof: String(formData.get("paymentProof") || "") || null,
    },
  });
  redirect(`/booking-success?ref=${ref}`);
}

export async function createVehicleBooking(formData: FormData) {
  const customer = await getCustomer();
  if (!customer) loginRedirect(formData);

  const vehicleId = String(formData.get("vehicleId"));
  const pickupDate = new Date(String(formData.get("pickupDate")));
  const returnDate = new Date(String(formData.get("returnDate")));
  const withDriver = formData.get("withDriver") === "1";
  const oneWay = formData.get("oneWay") === "1";
  const dropPlace = String(formData.get("dropPlace") || "").trim();
  const name = String(formData.get("customerName") || "").trim();
  const phone = String(formData.get("customerPhone") || "").trim();
  const email = String(formData.get("customerEmail") || "").trim();
  const coupon = String(formData.get("coupon") || "").trim();

  if (!vehicleId || !name || !phone) throw new Error("Missing required fields");

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new Error("Vehicle not found");

  const days = daysBetween(pickupDate, returnDate);
  const base = vehicle.pricePerDay * days + (withDriver ? 2000 * days : 0);
  const discount = await couponDiscount(coupon || null, base);
  const ref = bookingRef("VEH");

  await prisma.booking.create({
    data: {
      ref,
      serviceType: "VEHICLE",
      status: "PENDING",
      customerName: name,
      customerPhone: phone,
      customerEmail: email || null,
      vehicleId,
      pickupDate,
      returnDate,
      withDriver,
      oneWay,
      dropPlace: oneWay ? dropPlace : null,
      subtotal: base,
      discount,
      amount: base - discount,
      couponCode: discount > 0 ? coupon : null,
      userId: customer!.id,
      paymentProof: String(formData.get("paymentProof") || "") || null,
    },
  });
  redirect(`/booking-success?ref=${ref}`);
}

export async function createReview(formData: FormData) {
  const customer = await getCustomer();
  if (!customer) loginRedirect(formData);

  const serviceType = String(formData.get("serviceType"));
  const busId = String(formData.get("busId") || "");
  const hotelId = String(formData.get("hotelId") || "");
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating") || 5)));
  const comment = String(formData.get("comment") || "").trim();

  if (!comment) throw new Error("Comment is required");
  if (serviceType !== "BUS" && serviceType !== "HOTEL") throw new Error("Invalid service");

  await prisma.review.create({
    data: {
      serviceType,
      busId: serviceType === "BUS" ? busId : null,
      hotelId: serviceType === "HOTEL" ? hotelId : null,
      author: customer!.name,
      rating,
      comment,
    },
  });

  if (serviceType === "BUS") revalidatePath(`/buses/${busId}`);
  else revalidatePath(`/hotels/${hotelId}`);
}
