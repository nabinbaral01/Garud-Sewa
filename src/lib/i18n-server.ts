import "server-only";
import { cookies } from "next/headers";
import type { Lang } from "./i18n";

export async function getLang(): Promise<Lang> {
  const jar = await cookies();
  return jar.get("gs_lang")?.value === "ne" ? "ne" : "en";
}
