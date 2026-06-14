"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { npr } from "@/lib/format";
import { createVehicleBooking } from "@/app/actions";
import PaymentConfirm, { type PaymentInfo } from "./PaymentConfirm";

type Customer = { name: string; email: string } | null;

export default function VehicleBooking({
  vehicleId,
  pricePerDay,
  days,
  pickupDate,
  returnDate,
  oneWay,
  drop,
  withDriverAvailable,
  selfDriveAvailable,
  customer,
  payment,
}: {
  vehicleId: string;
  pricePerDay: number;
  days: number;
  pickupDate: string;
  returnDate: string;
  oneWay: boolean;
  drop: string;
  withDriverAvailable: boolean;
  selfDriveAvailable: boolean;
  customer: Customer;
  payment: PaymentInfo;
}) {
  const [withDriver, setWithDriver] = useState(withDriverAvailable);
  const driverFee = withDriver ? 2000 * days : 0;
  const total = pricePerDay * days + driverFee;
  const pathname = usePathname();
  const search = useSearchParams();
  const next = `${pathname}?${search.toString()}`;

  return (
    <form action={createVehicleBooking} className="grid gap-6 lg:grid-cols-3">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input type="hidden" name="pickupDate" value={pickupDate} />
      <input type="hidden" name="returnDate" value={returnDate} />
      <input type="hidden" name="oneWay" value={oneWay ? "1" : "0"} />
      <input type="hidden" name="dropPlace" value={drop} />
      <input type="hidden" name="withDriver" value={withDriver ? "1" : "0"} />
      <input type="hidden" name="next" value={next} />

      <div className="space-y-4 lg:col-span-2">
        <div className="gs-card p-5">
          <h2 className="mb-3 text-lg font-bold">Driver option</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {selfDriveAvailable && (
              <button
                type="button"
                onClick={() => setWithDriver(false)}
                className={`rounded-xl border p-4 text-left ${!withDriver ? "border-gsviolet bg-indigo-50/40" : "border-[var(--border)]"}`}
              >
                <div className="font-semibold">Self-drive</div>
                <div className="text-xs text-[var(--muted)]">Drive it yourself. Deposit applies.</div>
              </button>
            )}
            {withDriverAvailable && (
              <button
                type="button"
                onClick={() => setWithDriver(true)}
                className={`rounded-xl border p-4 text-left ${withDriver ? "border-gsviolet bg-indigo-50/40" : "border-[var(--border)]"}`}
              >
                <div className="font-semibold">With driver (+{npr(2000)}/day)</div>
                <div className="text-xs text-[var(--muted)]">Experienced local driver included.</div>
              </button>
            )}
          </div>
        </div>

        <div className="gs-card space-y-3 p-5">
          <h2 className="text-lg font-bold">Your details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="gs-label">Full name *</label>
              <input name="customerName" required defaultValue={customer?.name ?? ""} className="gs-input" />
            </div>
            <div>
              <label className="gs-label">Phone *</label>
              <input name="customerPhone" required className="gs-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="gs-label">Email</label>
              <input name="customerEmail" type="email" defaultValue={customer?.email ?? ""} className="gs-input" />
            </div>
            <div>
              <label className="gs-label">Coupon</label>
              <input name="coupon" className="gs-input" placeholder="Optional" />
            </div>
          </div>
        </div>
      </div>

      <aside className="gs-card h-fit space-y-3 p-5">
        <h3 className="font-bold">Booking summary</h3>
        <div className="space-y-1 text-sm text-[var(--muted)]">
          <div className="flex justify-between"><span>Pickup</span><span>{pickupDate}</span></div>
          <div className="flex justify-between"><span>Return</span><span>{returnDate}</span></div>
          {oneWay && drop && <div className="flex justify-between"><span>Drop-off</span><span>{drop}</span></div>}
          <div className="flex justify-between"><span>Rate × {days} day(s)</span><span>{npr(pricePerDay * days)}</span></div>
          {driverFee > 0 && <div className="flex justify-between"><span>Driver</span><span>{npr(driverFee)}</span></div>}
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
      </aside>
    </form>
  );
}
