"use client";

import { useState } from "react";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { deletePlace, bulkDeletePlaces, movePlace, setPlaceOrder } from "@/app/admin/actions";
import { EditLink } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";

type Place = {
  id: string;
  nameEn: string;
  nameNe: string;
  district: string;
  type: string;
  lat: number | null;
  lng: number | null;
};

export default function PlacesTable({ places }: { places: Place[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allChecked = places.length > 0 && selected.size === places.length;
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(places.map((p) => p.id)));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-gsviolet bg-indigo-50/50 px-4 py-2">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <form action={bulkDeletePlaces}>
            <input type="hidden" name="ids" value={[...selected].join(",")} />
            <ConfirmSubmit
              title="Delete places"
              message={`Delete ${selected.size} selected place(s)? Places used by a Hiace, hotel or route will be skipped.`}
              cta="Delete selected"
              className="gs-btn bg-[#e11d48] text-sm text-white"
            >
              <Trash2 size={15} /> Delete selected
            </ConfirmSubmit>
          </form>
        </div>
      )}

      <div className="gs-card overflow-x-auto p-2">
        <table className="gs-table">
          <thead>
            <tr>
              <th className="w-8">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all" />
              </th>
              <th className="w-20">Order #</th>
              <th>Name</th>
              <th>Nepali</th>
              <th>District</th>
              <th>Type</th>
              <th>GPS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {places.map((p, i) => (
              <tr key={p.id} className={selected.has(p.id) ? "bg-indigo-50/40" : ""}>
                <td>
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.nameEn}`} />
                </td>
                <td>
                  <form action={setPlaceOrder} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      key={i}
                      name="position"
                      type="number"
                      min={1}
                      defaultValue={i + 1}
                      className="gs-input !w-14 !px-2 !py-1 text-sm"
                      title="Type a position and press Enter"
                    />
                  </form>
                </td>
                <td className="font-medium">{p.nameEn}</td>
                <td>{p.nameNe}</td>
                <td>{p.district}</td>
                <td><span className="gs-chip">{p.type}</span></td>
                <td className="text-xs text-[var(--muted)]">{p.lat && p.lng ? `${p.lat}, ${p.lng}` : "—"}</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    <span className="flex items-center gap-0.5">
                      <form action={movePlace}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button className="text-[var(--muted)] hover:text-gsviolet" title="Move up (earlier on corridor)"><ArrowUp size={14} /></button>
                      </form>
                      <form action={movePlace}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button className="text-[var(--muted)] hover:text-gsviolet" title="Move down (later on corridor)"><ArrowDown size={14} /></button>
                      </form>
                    </span>
                    <EditLink href={`/admin/places?edit=${p.id}`} />
                    <DeleteButton action={deletePlace} id={p.id} confirmText={`Delete "${p.nameEn}"?`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
