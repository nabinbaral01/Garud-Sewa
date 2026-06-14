import { Star } from "lucide-react";

export default function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} fill={i < full ? "currentColor" : "none"} className={i < full ? "" : "text-slate-300"} />
      ))}
    </span>
  );
}
