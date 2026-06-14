import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettings } from "@/app/admin/actions";
import { Field, Notice } from "@/components/admin/ui";
import SettingImageUpload from "@/components/admin/SettingImageUpload";

const GROUPS: { title: string; fields: { key: string; label: string; textarea?: boolean }[] }[] = [
  {
    title: "Brand & contact",
    fields: [
      { key: "siteName", label: "Site name" },
      { key: "tagline", label: "Tagline (English)" },
      { key: "taglineNe", label: "Tagline (Nepali)" },
      { key: "contactEmail", label: "Contact email" },
      { key: "contactPhone", label: "Contact phone" },
      { key: "facebook", label: "Facebook URL" },
      { key: "instagram", label: "Instagram URL" },
    ],
  },
  {
    title: "Homepage",
    fields: [
      { key: "heroImage", label: "Hero background image (e.g. Pathibhara)" },
      { key: "heroTitle", label: "Hero title" },
      { key: "heroSubtitle", label: "Hero subtitle", textarea: true },
      { key: "trustBadge1", label: "Trust badge 1" },
      { key: "trustBadge2", label: "Trust badge 2" },
      { key: "trustRating", label: "Trust rating" },
    ],
  },
  {
    title: "Content pages",
    fields: [
      { key: "aboutText", label: "About text", textarea: true },
      { key: "helpText", label: "Help text", textarea: true },
      { key: "termsText", label: "Terms text", textarea: true },
      { key: "footerNote", label: "Footer note" },
    ],
  },
  {
    title: "Pricing",
    fields: [{ key: "serviceFee", label: "Service fee (NPR)" }],
  },
  {
    title: "Payment (FonePay QR at checkout)",
    fields: [
      { key: "paymentQr", label: "FonePay QR image" },
      { key: "paymentMerchant", label: "Merchant name" },
      { key: "paymentTerminal", label: "Terminal" },
      { key: "paymentBranch", label: "Bank branch" },
    ],
  },
];

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN") redirect("/admin");
  const { saved } = await searchParams;
  const s = await getSettings();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Site settings</h1>
      <p className="mb-5 text-sm text-[var(--muted)]">Edit all front-end content and branding</p>
      {saved && <Notice kind="success">Settings saved.</Notice>}
      <form action={saveSettings} className="space-y-6">
        {GROUPS.map((g) => (
          <div key={g.title} className="gs-card p-5">
            <h2 className="mb-3 font-bold">{g.title}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {g.fields.map((f) => (
                <Field key={f.key} label={f.label} full={f.textarea || f.key === "paymentQr" || f.key === "heroImage"}>
                  {f.key === "paymentQr" || f.key === "heroImage" ? (
                    <SettingImageUpload name={f.key} defaultValue={s[f.key]} />
                  ) : f.textarea ? (
                    <textarea name={f.key} rows={3} defaultValue={s[f.key]} className="gs-input" />
                  ) : (
                    <input name={f.key} defaultValue={s[f.key]} className="gs-input" />
                  )}
                </Field>
              ))}
            </div>
          </div>
        ))}
        <button className="gs-btn gs-btn-primary">Save all settings</button>
      </form>
    </div>
  );
}
