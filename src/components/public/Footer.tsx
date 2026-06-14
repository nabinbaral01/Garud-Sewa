import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export default async function Footer() {
  const [s, lang] = await Promise.all([getSettings(), getLang()]);
  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="text-lg font-extrabold gs-text-gradient">{s.siteName}</div>
          <p className="mt-2 text-sm text-[var(--muted)]">{s.aboutText}</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">{t(lang, "footerRoutes")}</h4>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li><Link href="/buses?from=Birtamod&to=Phungling" className="hover:text-[var(--ink)]">Birtamod → Phungling</Link></li>
            <li><Link href="/buses?from=Charali&to=Ilam Bazaar" className="hover:text-[var(--ink)]">Charali → Ilam</Link></li>
            <li><Link href="/buses?from=Phidim&to=Phungling" className="hover:text-[var(--ink)]">Phidim → Phungling</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">{t(lang, "footerHelp")}</h4>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li><Link href="/help" className="hover:text-[var(--ink)]">{t(lang, "helpCenter")}</Link></li>
            <li><Link href="/about" className="hover:text-[var(--ink)]">{t(lang, "aboutUs")}</Link></li>
            <li><Link href="/terms" className="hover:text-[var(--ink)]">{t(lang, "terms")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">{t(lang, "footerContact")}</h4>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex items-center gap-2"><Mail size={14} /> {s.contactEmail}</li>
            <li className="flex items-center gap-2"><Phone size={14} /> {s.contactPhone}</li>
            <li className="flex items-center gap-2"><MapPin size={14} /> Eastern Nepal</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--muted)]">
        {s.footerNote}
      </div>
    </footer>
  );
}
