import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { upsertStaff, deleteStaff } from "@/app/admin/actions";
import { AdminHeader, Field, EditLink, FormCard, Notice } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import { fmtDate } from "@/lib/format";

export default async function StaffAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string }> }) {
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN") redirect("/admin");
  const { edit, error } = await searchParams;
  const editing = edit !== undefined;
  const rec = edit && edit !== "new" ? await prisma.adminUser.findUnique({ where: { id: edit } }) : null;
  const staff = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <AdminHeader title="Staff accounts" subtitle="Super Admins & Editors" addHref="/admin/staff?edit=new" addLabel="Add staff" editing={editing} />
      {error === "self" && <Notice kind="error">You cannot delete your own account.</Notice>}
      {editing && (
        <FormCard>
          <h2 className="mb-3 font-bold">{rec ? "Edit staff" : "New staff"}</h2>
          <form action={upsertStaff} className="grid gap-3 sm:grid-cols-2">
            {rec && <input type="hidden" name="id" value={rec.id} />}
            <Field label="Name *"><input name="name" required defaultValue={rec?.name} className="gs-input" /></Field>
            <Field label="Email *"><input name="email" type="email" required defaultValue={rec?.email} className="gs-input" /></Field>
            <Field label="Role">
              <select name="role" defaultValue={rec?.role ?? "EDITOR"} className="gs-input">
                <option value="EDITOR">Editor / Manager</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </Field>
            <Field label={rec ? "New password (leave blank to keep)" : "Password *"}>
              <input name="password" type="password" {...(rec ? {} : { required: true })} className="gs-input" />
            </Field>
            {rec && <Field label="Active"><label className="flex items-center gap-2 pt-2"><input type="checkbox" name="active" defaultChecked={rec.active} /> Enabled</label></Field>}
            <div className="sm:col-span-2"><button className="gs-btn gs-btn-primary">{rec ? "Save changes" : "Create staff"}</button></div>
          </form>
        </FormCard>
      )}
      <div className="gs-card overflow-x-auto p-2">
        <table className="gs-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {staff.map((a) => (
              <tr key={a.id}>
                <td className="font-medium">{a.name} {a.id === session.id && <span className="gs-chip ml-1">you</span>}</td>
                <td>{a.email}</td>
                <td><span className="gs-chip">{a.role === "SUPER_ADMIN" ? "Super Admin" : "Editor"}</span></td>
                <td>{a.active ? "Yes" : "No"}</td>
                <td className="text-xs text-[var(--muted)]">{fmtDate(a.createdAt)}</td>
                <td className="text-right"><div className="flex justify-end gap-3"><EditLink href={`/admin/staff?edit=${a.id}`} />{a.id !== session.id && <DeleteButton action={deleteStaff} id={a.id} confirmText={`Delete ${a.name}?`} />}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
