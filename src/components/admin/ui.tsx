import Link from "next/link";
import { Plus, Pencil, X } from "lucide-react";

export function AdminHeader({
  title,
  subtitle,
  addHref,
  addLabel = "Add new",
  editing,
}: {
  title: string;
  subtitle?: string;
  addHref?: string;
  addLabel?: string;
  editing?: boolean;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      {addHref &&
        (editing ? (
          <Link href={addHref.split("?")[0]} className="gs-btn gs-btn-ghost text-sm">
            <X size={15} /> Close form
          </Link>
        ) : (
          <Link href={addHref} className="gs-btn gs-btn-primary text-sm">
            <Plus size={15} /> {addLabel}
          </Link>
        ))}
    </div>
  );
}

export function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="gs-label">{label}</label>
      {children}
    </div>
  );
}

export function EditLink({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-gsviolet hover:underline">
      <Pencil size={14} /> Edit
    </Link>
  );
}

export function Notice({ kind, children }: { kind: "success" | "error"; children: React.ReactNode }) {
  return (
    <div
      className={`mb-4 rounded-lg px-3 py-2 text-sm ${
        kind === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {children}
    </div>
  );
}

export function FormCard({ children }: { children: React.ReactNode }) {
  return <div className="gs-card mb-6 p-5">{children}</div>;
}
