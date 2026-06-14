"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, LogIn, Bus } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import MobileMenu from "./MobileMenu";
import LanguageToggle from "./LanguageToggle";

export default function TopBarClient({
  siteName,
  lang,
  light = false,
}: {
  siteName: string;
  lang: Lang;
  light?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // transparent/white styling only while over the hero (light AND not scrolled)
  const overHero = light && !scrolled;

  return (
    <header
      className={`sticky top-0 z-40 transition-colors ${
        overHero ? "bg-transparent" : "bg-white/95 backdrop-blur border-b border-[var(--border)]"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${overHero ? "bg-white/20" : "gs-gradient"}`}>
            <Bus size={18} />
          </span>
          <span className={`truncate whitespace-nowrap text-lg font-extrabold ${overHero ? "text-white" : "gs-text-gradient"}`}>{siteName}</span>
        </Link>
        <nav className={`hidden items-center gap-6 text-sm font-medium md:flex ${overHero ? "text-white/85" : "text-[var(--muted)]"}`}>
          <Link href="/buses" className={overHero ? "hover:text-white" : "hover:text-[var(--ink)]"}>{t(lang, "buses")}</Link>
          <Link href="/hotels" className={overHero ? "hover:text-white" : "hover:text-[var(--ink)]"}>{t(lang, "hotels")}</Link>
          <Link href="/vehicles" className={overHero ? "hover:text-white" : "hover:text-[var(--ink)]"}>{t(lang, "carJeep")}</Link>
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageToggle lang={lang} light={overHero} />
          <button aria-label="Favorites" className="gs-btn gs-btn-ghost hidden h-9 w-9 !p-0 sm:inline-flex">
            <Heart size={16} />
          </button>
          <Link href="/account" className="gs-btn gs-btn-ghost h-9 !px-2.5 text-sm sm:!px-4">
            <LogIn size={15} /> <span className="hidden sm:inline">{t(lang, "login")}</span>
          </Link>
          <MobileMenu light={overHero} />
        </div>
      </div>
    </header>
  );
}
