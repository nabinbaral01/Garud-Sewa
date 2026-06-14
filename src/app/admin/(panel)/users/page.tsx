import { prisma } from "@/lib/db";
import { toggleUser } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/ui";
import { fmtDate, npr } from "@/lib/format";

export default async function UsersAdmin() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { bookings: { where: { deleted: false } } },
  });

  return (
    <div>
      <AdminHeader title="Customers" subtitle={`${users.length} registered customers`} />
      <div className="gs-card overflow-x-auto p-2">
        <table className="gs-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Bookings</th><th>Spent</th><th>Joined</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone || "—"}</td>
                <td>{u.bookings.length}</td>
                <td>{npr(u.bookings.reduce((s, b) => s + b.amount, 0))}</td>
                <td className="text-xs text-[var(--muted)]">{fmtDate(u.createdAt)}</td>
                <td>{u.active ? <span className="text-emerald-600">Active</span> : <span className="text-rose-600">Disabled</span>}</td>
                <td className="text-right">
                  <form action={toggleUser}><input type="hidden" name="id" value={u.id} /><button className="text-sm text-gsviolet">{u.active ? "Disable" : "Enable"}</button></form>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-[var(--muted)]">No customers yet. Guest bookings appear under Bookings.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
