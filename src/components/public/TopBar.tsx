import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/i18n-server";
import TopBarClient from "./TopBarClient";

export default async function TopBar({ light = false }: { light?: boolean }) {
  const [s, lang] = await Promise.all([getSettings(), getLang()]);
  return <TopBarClient siteName={s.siteName} lang={lang} light={light} />;
}
