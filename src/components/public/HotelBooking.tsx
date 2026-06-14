"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Users, BedDouble, Utensils, LogIn } from "lucide-react";
import { npr } from "@/lib/format";
import { createHotelBooking } from "@/app/actions";
import PaymentConfirm, { type PaymentInfo } from "./PaymentConfirm";

type Customer = { name: string; email: string } | null;

type Room = {
  id: string;
  name: string;
  capacity: number;
  beds: string;
  mealPlan: string;
  pricePerNight: number;
  roomsAvailable: number;
};

export default function HotelBooking({
  hotelId,
  rooms,
  nights,
  checkIn,
  checkOut,
  guests,
  roomsCount,
  customer,
  payment,
}: {
  hotelId: string;
  rooms: Room[];
  nights: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomsCount: number;
  customer: Customer;
  payment: PaymentInfo;
}) {
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const room = rooms.find((r) => r.id === roomId) ?? rooms[0];
  const total = room ? room.pricePerNight * nights * roomsCount : 0;
  const pathname = usePathname();
  const search = useSearchParams();
  const next = `${pathname}?${search.toString()}`;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <h2 className="text-lg font-bold">Available rooms for {nights} night(s)</h2>
        {rooms.map((r) => (
          <label
            key={r.id}
            className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${
              roomId === r.id ? "border-gsviolet bg-indigo-50/40" : "border-[var(--border)] bg-white"
            }`}
          >
            <input type="radio" name="room" checked={roomId === r.id} onChange={() => setRoomId(r.id)} />
            <div className="flex-1">
              <div className="font-semibold">{r.name}</div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                <span className="flex items-center gap-1"><Users size={12} /> {r.capacity} guests</span>
                <span className="flex items-center gap-1"><BedDouble size={12} /> {r.beds}</span>
                <span className="flex items-center gap-1"><Utensils size={12} /> {r.mealPlan}</span>
              </div>
              <div className="mt-1 text-xs text-emerald-600">{r.roomsAvailable} rooms left</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-extrabold gs-text-gradient">{npr(r.pricePerNight)}</div>
              <div className="text-xs text-[var(--muted)]">per night</div>
            </div>
          </label>
        ))}
      </div>

      <form action={createHotelBooking} className="gs-card h-fit space-y-4 p-5">
        <input type="hidden" name="hotelId" value={hotelId} />
        <input type="hidden" name="roomTypeId" value={roomId} />
        <input type="hidden" name="checkIn" value={checkIn} />
        <input type="hidden" name="checkOut" value={checkOut} />
        <input type="hidden" name="rooms" value={roomsCount} />
        <input type="hidden" name="guests" value={guests} />
        <input type="hidden" name="next" value={next} />
        <h3 className="font-bold">Your booking</h3>
        <div className="space-y-1 text-sm text-[var(--muted)]">
          <div className="flex justify-between"><span>Check-in</span><span>{checkIn}</span></div>
          <div className="flex justify-between"><span>Check-out</span><span>{checkOut}</span></div>
          <div className="flex justify-between"><span>Room</span><span>{room?.name}</span></div>
          <div className="flex justify-between"><span>{nights} night(s) × {roomsCount} room(s)</span><span>{npr(total)}</span></div>
        </div>
        <div className="grid gap-3">
          <div>
            <label className="gs-label">Full name *</label>
            <input name="customerName" required defaultValue={customer?.name ?? ""} className="gs-input" />
          </div>
          <div>
            <label className="gs-label">Phone *</label>
            <input name="customerPhone" required className="gs-input" />
          </div>
          <div>
            <label className="gs-label">Email</label>
            <input name="customerEmail" type="email" defaultValue={customer?.email ?? ""} className="gs-input" />
          </div>
          <div>
            <label className="gs-label">Coupon</label>
            <input name="coupon" className="gs-input" placeholder="Optional" />
          </div>
        </div>
        <div className="flex justify-between border-t border-[var(--border)] pt-3 text-lg font-extrabold">
          <span>Total</span>
          <span className="gs-text-gradient">{npr(total)}</span>
        </div>
        {customer ? (
          <PaymentConfirm label="Confirm booking" payment={payment} className="gs-btn gs-btn-primary w-full" />
        ) : (
          <Link href={`/account?tab=login&next=${encodeURIComponent(next)}`} className="gs-btn gs-btn-primary w-full">
            <LogIn size={16} /> Login to confirm
          </Link>
        )}
        <p className="text-center text-xs text-[var(--muted)]">Book now, pay later</p>
      </form>
    </div>
  );
}
