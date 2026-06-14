"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, LogIn } from "lucide-react";
import { buildSeatMap, seatRows } from "@/lib/seats";
import { npr, fmtTime } from "@/lib/format";
import { createBusBooking } from "@/app/actions";
import PaymentConfirm, { type PaymentInfo } from "./PaymentConfirm";

type Customer = { name: string; email: string } | null;

type BusData = {
  id: string;
  operator: string;
  busType: string;
  departTime: string;
  arriveTime: string;
  boardingPoint: string;
  dropPoint: string;
  totalSeats: number;
  seatLayout: string;
  baseFare: number;
  fromName: string;
  toName: string;
};

export default function BusBooking({
  bus,
  bookedSeats,
  date,
  customer,
  boardFrom,
  dropTo,
  payment,
}: {
  bus: BusData;
  bookedSeats: string[];
  date: string;
  customer: Customer;
  boardFrom: string;
  dropTo: string;
  payment: PaymentInfo;
}) {
  const seats = buildSeatMap(bus.totalSeats, bus.seatLayout);
  const rows = seatRows(seats);
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const pathname = usePathname();
  const search = useSearchParams();
  const next = `${pathname}?${search.toString()}`;

  const toggle = (label: string) => {
    if (bookedSeats.includes(label)) return;
    setSelected((s) => (s.includes(label) ? s.filter((x) => x !== label) : [...s, label]));
  };

  const total = bus.baseFare * selected.length;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {step === 1 ? (
          <div className="gs-card p-5">
            <h2 className="mb-1 text-lg font-bold">Select your seats</h2>
            <p className="mb-4 text-sm text-[var(--muted)]">Tap seats to select — book as many as you like.</p>
            <div className="mb-4 flex gap-4 text-xs">
              <Legend color="bg-white border" label="Available" />
              <Legend color="gs-gradient" label="Selected" textWhite />
              <Legend color="bg-slate-300" label="Booked" />
            </div>
            <div className="inline-block rounded-xl border border-[var(--border)] p-4">
              <div className="mb-3 text-right text-xs text-[var(--muted)]">🚍 Front</div>
              <div className="space-y-2">
                {rows.map((row, ri) => (
                  <div key={ri} className="flex items-center gap-2">
                    {row.map((seat) => {
                      if (seat.driver) {
                        return (
                          <span key={seat.id} className="flex items-center">
                            <span
                              title="Driver seat (not bookable)"
                              className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-200 text-base"
                            >
                              🚖
                            </span>
                            {seat.aisleAfter && <span className="w-4" />}
                          </span>
                        );
                      }
                      const booked = bookedSeats.includes(seat.label);
                      const sel = selected.includes(seat.label);
                      return (
                        <span key={seat.id} className="flex items-center">
                          <button
                            type="button"
                            disabled={booked}
                            onClick={() => toggle(seat.label)}
                            title={`Seat ${seat.label}`}
                            className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold transition ${
                              booked
                                ? "cursor-not-allowed bg-slate-300 text-slate-500"
                                : sel
                                ? "gs-gradient text-white"
                                : "border border-[var(--border)] bg-white hover:border-gsviolet"
                            }`}
                          >
                            {sel ? <Check size={14} /> : seat.label}
                          </button>
                          {seat.aisleAfter && <span className="w-4" />}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <button
                disabled={selected.length === 0}
                onClick={() => setStep(2)}
                className="gs-btn gs-btn-primary disabled:opacity-50"
              >
                Continue to passenger details
              </button>
            </div>
          </div>
        ) : (
          <form action={createBusBooking} className="gs-card space-y-4 p-5">
            <input type="hidden" name="busId" value={bus.id} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="seats" value={selected.join(",")} />
            <input type="hidden" name="boardFrom" value={boardFrom} />
            <input type="hidden" name="dropTo" value={dropTo} />
            <input type="hidden" name="next" value={next} />
            <h2 className="text-lg font-bold">Passenger details</h2>
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
                <label className="gs-label">Coupon code</label>
                <input name="coupon" className="gs-input" placeholder="Optional" />
              </div>
            </div>
            <p className="text-xs text-[var(--muted)]">Book now, pay on boarding. Seats: {selected.join(", ")}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="gs-btn gs-btn-ghost">
                Back
              </button>
              {customer ? (
                <PaymentConfirm label={`Confirm booking · ${npr(total)}`} payment={payment} className="gs-btn gs-btn-primary flex-1" />
              ) : (
                <Link href={`/account?tab=login&next=${encodeURIComponent(next)}`} className="gs-btn gs-btn-primary flex-1">
                  <LogIn size={16} /> Login to confirm
                </Link>
              )}
            </div>
          </form>
        )}
      </div>

      <aside className="gs-card h-fit space-y-3 p-5">
        <h3 className="font-bold">{bus.operator}</h3>
        <div className="gs-chip">{bus.busType}</div>
        <div className="text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">{bus.fromName}</span>
            <span className="font-semibold">{fmtTime(bus.departTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">{bus.toName}</span>
            <span className="font-semibold">{fmtTime(bus.arriveTime)}</span>
          </div>
        </div>
        <div className="border-t border-[var(--border)] pt-3 text-sm">
          <div className="flex justify-between"><span>Boarding</span><span className="text-right text-[var(--muted)]">{bus.boardingPoint}</span></div>
          <div className="flex justify-between"><span>Drop</span><span className="text-right text-[var(--muted)]">{bus.dropPoint}</span></div>
          <div className="flex justify-between"><span>Travel date</span><span className="text-[var(--muted)]">{date}</span></div>
        </div>
        <div className="border-t border-[var(--border)] pt-3">
          <div className="flex justify-between text-sm">
            <span>Seats × {selected.length}</span>
            <span>{npr(total)}</span>
          </div>
          <div className="mt-2 flex justify-between text-lg font-extrabold">
            <span>Total</span>
            <span className="gs-text-gradient">{npr(total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Legend({ color, label, textWhite }: { color: string; label: string; textWhite?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-4 w-4 rounded ${color} ${textWhite ? "text-white" : ""}`} />
      {label}
    </span>
  );
}
