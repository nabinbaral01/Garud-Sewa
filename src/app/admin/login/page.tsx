import Link from "next/link";
import { Bus, LogIn } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loginAction } from "@/app/admin/actions";

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (await getSession()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center gs-gradient p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl gs-gradient text-white">
            <Bus size={20} />
          </span>
          <div>
            <div className="font-extrabold gs-text-gradient">Garud Sewa</div>
            <div className="text-xs text-[var(--muted)]">Admin panel</div>
          </div>
        </div>
        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Invalid email or password.
          </div>
        )}
        <form action={loginAction} className="space-y-3">
          <div>
            <label className="gs-label">Email</label>
            <input name="email" type="email" required className="gs-input" defaultValue="admin@gadursewa.com" />
          </div>
          <div>
            <label className="gs-label">Password</label>
            <input name="password" type="password" required className="gs-input" />
          </div>
          <button className="gs-btn gs-btn-primary w-full">
            <LogIn size={16} /> Sign in
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--ink)]">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}
