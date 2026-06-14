"use client";

import { useState } from "react";
import { Bus, Hotel, Car, ArrowLeftRight, Search } from "lucide-react";
import PlaceAutocomplete, { PlaceOption } from "./PlaceAutocomplete";
import { isoDate, addDays } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";

type Tab = "buses" | "hotels" | "vehicles";

const TABS: { key: Tab; tkey: string; icon: React.ReactNode }[] = [
  { key: "buses", tkey: "buses", icon: <Bus size={20} /> },
  { key: "hotels", tkey: "hotels", icon: <Hotel size={20} /> },
  { key: "vehicles", tkey: "carJeep", icon: <Car size={20} /> },
];

export default function ServiceTabs({
  places,
  initialTab = "buses",
  lang = "en",
}: {
  places: PlaceOption[];
  initialTab?: Tab;
  lang?: Lang;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const today = isoDate(new Date());
  const tomorrow = isoDate(addDays(new Date(), 1));

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <div className="gs-card shadow-xl">
      <div className="flex overflow-hidden rounded-t-[0.9rem]">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
              tab === item.key ? "gs-gradient text-white" : "bg-white text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {item.icon}
            <span>{t(lang, item.tkey)}</span>
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-5">
        {tab === "buses" && (
          <form action="/buses" method="get" className="grid gap-3 md:grid-cols-12">
            <div className="gs-card p-2 md:col-span-3">
              <label className="gs-label">{t(lang, "from")}</label>
              <PlaceAutocomplete name="from" placeholder={t(lang, "leavingFrom")} options={places} value={from} onValueChange={setFrom} />
            </div>
            <div className="flex items-end justify-center md:col-span-1">
              <button
                type="button"
                aria-label="Swap"
                onClick={() => {
                  setFrom(to);
                  setTo(from);
                }}
                className="gs-btn gs-btn-ghost h-10 w-10 !p-0"
              >
                <ArrowLeftRight size={16} />
              </button>
            </div>
            <div className="gs-card p-2 md:col-span-3">
              <label className="gs-label">{t(lang, "to")}</label>
              <PlaceAutocomplete name="to" placeholder={t(lang, "goingTo")} options={places} value={to} onValueChange={setTo} />
            </div>
            <div className="gs-card p-2 md:col-span-3">
              <label className="gs-label">{t(lang, "date")}</label>
              <input type="date" name="date" defaultValue={today} min={today} className="gs-input bare" />
            </div>
            <div className="flex items-end md:col-span-2">
              <button className="gs-btn gs-btn-primary w-full">
                <Search size={16} /> {t(lang, "findBuses")}
              </button>
            </div>
          </form>
        )}

        {tab === "hotels" && (
          <form action="/hotels" method="get" className="grid gap-3 md:grid-cols-12">
            <div className="gs-card p-2 md:col-span-4">
              <label className="gs-label">{t(lang, "cityDest")}</label>
              <PlaceAutocomplete name="city" placeholder={t(lang, "whereGoing")} options={places} icon={<Hotel size={16} />} />
            </div>
            <div className="gs-card p-2 md:col-span-2">
              <label className="gs-label">{t(lang, "checkIn")}</label>
              <input type="date" name="checkIn" defaultValue={today} min={today} className="gs-input bare" />
            </div>
            <div className="gs-card p-2 md:col-span-2">
              <label className="gs-label">{t(lang, "checkOut")}</label>
              <input type="date" name="checkOut" defaultValue={tomorrow} min={tomorrow} className="gs-input bare" />
            </div>
            <div className="gs-card p-2 md:col-span-1">
              <label className="gs-label">{t(lang, "guests")}</label>
              <input type="number" name="guests" defaultValue={2} min={1} className="gs-input bare" />
            </div>
            <div className="gs-card p-2 md:col-span-1">
              <label className="gs-label">{t(lang, "rooms")}</label>
              <input type="number" name="rooms" defaultValue={1} min={1} className="gs-input bare" />
            </div>
            <div className="flex items-end md:col-span-2">
              <button className="gs-btn gs-btn-primary w-full">
                <Search size={16} /> {t(lang, "findHotels")}
              </button>
            </div>
          </form>
        )}

        {tab === "vehicles" && <VehicleForm places={places} today={today} tomorrow={tomorrow} lang={lang} />}
      </div>
    </div>
  );
}

function VehicleForm({
  places,
  today,
  tomorrow,
  lang,
}: {
  places: PlaceOption[];
  today: string;
  tomorrow: string;
  lang: Lang;
}) {
  const [oneWay, setOneWay] = useState(false);
  return (
    <form action="/vehicles" method="get" className="grid gap-3 md:grid-cols-12">
      <div className="gs-card p-2 md:col-span-3">
        <label className="gs-label">{t(lang, "pickupPoint")}</label>
        <PlaceAutocomplete name="pickup" placeholder={t(lang, "pickupLocation")} options={places} icon={<Car size={16} />} />
      </div>
      {oneWay && (
        <div className="gs-card p-2 md:col-span-3">
          <label className="gs-label">{t(lang, "dropOff")}</label>
          <PlaceAutocomplete name="drop" placeholder={t(lang, "returnAnother")} options={places} />
        </div>
      )}
      <div className={`gs-card p-2 ${oneWay ? "md:col-span-2" : "md:col-span-3"}`}>
        <label className="gs-label">{t(lang, "pickupDate")}</label>
        <input type="date" name="pickupDate" defaultValue={today} min={today} className="gs-input bare" />
      </div>
      <div className={`gs-card p-2 ${oneWay ? "md:col-span-2" : "md:col-span-3"}`}>
        <label className="gs-label">{t(lang, "returnDate")}</label>
        <input type="date" name="returnDate" defaultValue={tomorrow} min={tomorrow} className="gs-input bare" />
      </div>
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" checked={oneWay} onChange={(e) => setOneWay(e.target.checked)} name="oneWay" value="1" />
        {t(lang, "returnAnother")}
      </label>
      <div className="flex items-end md:col-span-2">
        <button className="gs-btn gs-btn-primary w-full">
          <Search size={16} /> {t(lang, "findVehicle")}
        </button>
      </div>
    </form>
  );
}
