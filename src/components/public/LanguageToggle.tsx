"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import type { Lang } from "@/lib/i18n";

export default function LanguageToggle({ lang, light = false }: { lang: Lang; light?: boolean }) {
  const router = useRouter();
  const next: Lang = lang === "en" ? "ne" : "en";

  function switchLang() {
    document.cookie = `gs_lang=${next}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <button
      onClick={switchLang}
      aria-label="Switch language"
      className={`gs-btn h-9 !px-2.5 text-sm ${light ? "border border-white/40 bg-white/10 text-white" : "gs-btn-ghost"}`}
      title={next === "ne" ? "नेपालीमा हेर्नुहोस्" : "View in English"}
    >
      <Globe size={15} /> {lang === "en" ? "नेपाली" : "English"}
    </button>
  );
}
