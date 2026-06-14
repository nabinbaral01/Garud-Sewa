import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const op = await prisma.operator.create({
    data: {
      name,
      contact: body.contact ? String(body.contact).trim() : null,
      rating: Number(body.rating) || 4,
    },
  });
  return NextResponse.json({ id: op.id, name: op.name });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await prisma.operator.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "This operator still has buses — delete or reassign those buses first." },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}
