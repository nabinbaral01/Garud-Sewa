import { prisma } from "./db";
import type { PlaceOption } from "@/components/public/PlaceAutocomplete";

export async function getPlaceOptions(): Promise<PlaceOption[]> {
  const places = await prisma.place.findMany({ orderBy: { sortOrder: "asc" } });
  return places.map((p) => ({ id: p.id, nameEn: p.nameEn, nameNe: p.nameNe, district: p.district }));
}

export async function findPlaceByName(name: string) {
  if (!name) return null;
  return prisma.place.findFirst({
    where: { nameEn: { equals: name.trim() } },
  });
}
