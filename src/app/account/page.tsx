import Link from "next/link";
import { UserCircle, LogIn, UserPlus, LogOut } from "lucide-react";
import TopBar from "@/components/public/TopBar";
import Footer from "@/components/public/Footer";
import { getCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { loginAction, signupAction, logoutAction } from "./actions";
import { npr, fmtDate, serviceLabel } from "@/lib/format";
import { StatusBadge } from "@/app/admin/(panel)/page";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const customer = await getCustomer();
  const next = sp.next || "/account";
  const tab = sp.tab === "signup" ? "signup" : "login";

  if (customer) {
    const bookings = await prisma.booking.findMany({
      where: { userId: customer.id, deleted: false },
      orderBy: { createdAt: "desc" },
      include: { bus: { include: { fromPlace: true, toPlace: true } }, hotel: true, vehicle: true },
    });
    return (
      <>
        <TopBar />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full gs-gradient text-lg font-bold text-white">
                {customer.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <h1 className="text-xl font-bold">{customer.name}</h1>
                <p className="text-sm text-[var(--muted)]">{customer.email}</p>
              </div>
            </div>
            <form action={logoutAction}>
              <button className="gs-btn gs-btn-ghost text-sm"><LogOut size={15} /> Logout</button>
            </form>
          </div>

          <h2 className="mt-8 mb-3 text-lg font-bold">My bookings</h2>
          {bookings.length === 0 ? (
            <div className="gs-card p-8 text-center text-[var(--muted)]">
              No bookings yet. <Link href="/" className="text-gsviolet">Start booking →</Link>
            </div>
          ) : (
            <div className="gs-card overflow-x-auto p-2">
              <table className="gs-table">
                <thead><tr><th>Ref</th><th>Service</th><th>Detail</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td className="font-mono text-xs">{b.ref}</td>
                      <td><span className="gs-chip">{serviceLabel(b.serviceType)}</span></td>
                      <td className="text-[var(--muted)]">
                        {b.bus ? `${b.boardFrom || b.bus.fromPlace.nameEn}→${b.dropTo || b.bus.toPlace.nameEn}` : b.hotel?.name || b.vehicle?.model || "—"}
                      </td>
                      <td>{npr(b.amount)}</td>
                      <td><StatusBadge status={b.status} /></td>
                      <td className="text-xs text-[var(--muted)]">{fmtDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="mb-6 text-center">
          <UserCircle size={48} className="mx-auto text-gsviolet" />
          <h1 className="mt-2 text-2xl font-bold">Welcome to Garud Sewa</h1>
          <p className="text-sm text-[var(--muted)]">Login or create an account to book and review.</p>
        </div>

        <div className="mb-4 flex rounded-lg border border-[var(--border)] p-1">
          <Link href={`/account?tab=login&next=${encodeURIComponent(next)}`} className={`flex-1 rounded-md py-2 text-center text-sm font-semibold ${tab === "login" ? "gs-gradient text-white" : "text-[var(--muted)]"}`}>Login</Link>
          <Link href={`/account?tab=signup&next=${encodeURIComponent(next)}`} className={`flex-1 rounded-md py-2 text-center text-sm font-semibold ${tab === "signup" ? "gs-gradient text-white" : "text-[var(--muted)]"}`}>Sign up</Link>
        </div>

        {sp.error && <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{sp.error}</div>}

        {tab === "login" ? (
          <form action={loginAction} className="gs-card space-y-3 p-5">
            <input type="hidden" name="next" value={next} />
            <div><label className="gs-label">Email</label><input name="email" type="email" required className="gs-input" /></div>
            <div><label className="gs-label">Password</label><input name="password" type="password" required className="gs-input" /></div>
            <button className="gs-btn gs-btn-primary w-full"><LogIn size={16} /> Login</button>
          </form>
        ) : (
          <form action={signupAction} className="gs-card space-y-3 p-5">
            <input type="hidden" name="next" value={next} />
            <div><label className="gs-label">Full name</label><input name="name" required className="gs-input" /></div>
            <div><label className="gs-label">Email</label><input name="email" type="email" required className="gs-input" /></div>
            <div><label className="gs-label">Phone</label><input name="phone" className="gs-input" /></div>
            <div><label className="gs-label">Password</label><input name="password" type="password" required minLength={6} className="gs-input" /></div>
            <button className="gs-btn gs-btn-primary w-full"><UserPlus size={16} /> Create account</button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Staff? <Link href="/admin" className="font-semibold text-gsviolet">Admin panel →</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
