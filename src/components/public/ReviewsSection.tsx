import Link from "next/link";
import { LogIn } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCustomer } from "@/lib/customer-auth";
import { fmtDate } from "@/lib/format";
import Stars from "./Stars";
import ReviewForm from "./ReviewForm";

export default async function ReviewsSection({
  serviceType,
  serviceId,
}: {
  serviceType: "BUS" | "HOTEL";
  serviceId: string;
}) {
  const reviews = await prisma.review.findMany({
    where: serviceType === "BUS" ? { busId: serviceId } : { hotelId: serviceId },
    orderBy: { createdAt: "desc" },
  });
  const customer = await getCustomer();
  const next = serviceType === "BUS" ? `/buses/${serviceId}` : `/hotels/${serviceId}`;

  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  // rating distribution 5→1
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold">Ratings & reviews</h2>

      <div className="grid gap-6 md:grid-cols-3">
        {/* summary */}
        <div className="gs-card flex flex-col items-center justify-center p-5 text-center">
          <div className="text-4xl font-extrabold gs-text-gradient">{avg.toFixed(1)}</div>
          <Stars value={avg} size={18} />
          <div className="mt-1 text-sm text-[var(--muted)]">{count} review{count !== 1 ? "s" : ""}</div>
        </div>

        {/* distribution */}
        <div className="gs-card p-5 md:col-span-2">
          {count === 0 ? (
            <p className="text-sm text-[var(--muted)]">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-2">
              {dist.map((d) => (
                <div key={d.star} className="flex items-center gap-3 text-sm">
                  <span className="w-10 text-[var(--muted)]">{d.star} ★</span>
                  <div className="h-2 flex-1 rounded bg-[var(--bg)]">
                    <div className="h-2 rounded gs-gradient" style={{ width: `${(d.n / count) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-[var(--muted)]">{d.n}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* list */}
      {count > 0 && (
        <div className="mt-4 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="gs-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full gs-gradient text-sm font-bold text-white">
                    {r.author.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-semibold">{r.author}</span>
                </div>
                <span className="text-xs text-[var(--muted)]">{fmtDate(r.createdAt)}</span>
              </div>
              <div className="mt-2"><Stars value={r.rating} /></div>
              <p className="mt-2 text-sm text-[var(--ink)]">{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      {customer ? (
        <ReviewForm serviceType={serviceType} serviceId={serviceId} />
      ) : (
        <div className="gs-card mt-4 flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm text-[var(--muted)]">Please log in to write a review.</p>
          <Link href={`/account?tab=login&next=${encodeURIComponent(next)}`} className="gs-btn gs-btn-primary text-sm">
            <LogIn size={15} /> Login to review
          </Link>
        </div>
      )}
    </section>
  );
}
