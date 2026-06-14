import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

  try {
    const url = await saveUpload(file);
    const asset = await prisma.mediaAsset.create({
      data: { filename: file.name, url, mime: file.type, size: file.size, alt: String(form.get("alt") || "") },
    });
    return NextResponse.json({ id: asset.id, url: asset.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
