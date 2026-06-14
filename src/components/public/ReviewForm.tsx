"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import { createReview } from "@/app/actions";

export default function ReviewForm({
  serviceType,
  serviceId,
}: {
  serviceType: "BUS" | "HOTEL";
  serviceId: string;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const pathname = usePathname();

  return (
    <form action={createReview} className="gs-card mt-4 space-y-3 p-4">
      <input type="hidden" name="serviceType" value={serviceType} />
      <input type="hidden" name={serviceType === "BUS" ? "busId" : "hotelId"} value={serviceId} />
      <input type="hidden" name="rating" value={rating} />
      <input type="hidden" name="next" value={pathname} />
      <h3 className="font-bold">Write a review</h3>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const v = i + 1;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setRating(v)}
              onMouseEnter={() => setHover(v)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${v} star`}
              className="text-amber-500"
            >
              <Star size={24} fill={(hover || rating) >= v ? "currentColor" : "none"} className={(hover || rating) >= v ? "" : "text-slate-300"} />
            </button>
          );
        })}
        <span className="ml-2 text-sm text-[var(--muted)]">{rating} / 5</span>
      </div>
      <textarea name="comment" required rows={3} placeholder="Share your experience…" className="gs-input" />
      <button className="gs-btn gs-btn-primary">Submit review</button>
    </form>
  );
}
