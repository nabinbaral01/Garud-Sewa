import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const nameEn = String(body.nameEn || "").trim();
  if (!nameEn) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const last = await prisma.place.findFirst({ orderBy: { sortOrder: "desc" } });
  const place = await prisma.place.create({
    data: {
      nameEn,
      nameNe: String(body.nameNe || nameEn).trim(),
      district: String(body.district || "Jhapa"),
      type: String(body.type || "city"),
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json({ id: place.id, nameEn: place.nameEn, district: place.district });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await prisma.place.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "This place is used by a bus, hotel, vehicle or route — reassign those first." },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}

