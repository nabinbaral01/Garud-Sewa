import "server-only";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Saves an uploaded image and returns its public URL.
// - On Vercel (BLOB_READ_WRITE_TOKEN set) → Vercel Blob (persistent cloud storage).
// - Locally (no token) → writes to public/uploads so dev keeps working.
export async function saveUpload(file: File, prefix = ""): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filename = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  // Use Vercel Blob whenever a token exists OR we're running on Vercel (the
  // serverless filesystem is read-only, so disk writes would fail there).
  if (token || process.env.VERCEL) {
    const { put } = await import("@vercel/blob");
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
      ...(token ? { token } : {}),
    });
    return blob.url;
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${filename}`;
}
