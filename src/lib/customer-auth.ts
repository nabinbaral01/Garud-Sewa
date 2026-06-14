import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const COOKIE = "gs_user";
const SECRET = process.env.SESSION_SECRET || "dev-secret";

export type CustomerSession = { id: string; name: string; email: string };

function sign(payload: string): string {
  const mac = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = token.slice(0, idx);
  const mac = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (mac.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  return payload;
}

async function setSessionCookie(s: CustomerSession) {
  const token = sign(Buffer.from(JSON.stringify(s)).toString("base64url"));
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function customerSignup(
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  email = email.toLowerCase().trim();
  if (!name || !email || !password) return { ok: false, error: "All fields are required" };
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters" };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "An account with this email already exists" };
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name: name.trim(), email, phone: phone.trim() || null, passwordHash } });
  await setSessionCookie({ id: user.id, name: user.name, email: user.email });
  return { ok: true };
}

export async function customerLogin(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  email = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !user.active) return { ok: false, error: "Invalid email or password" };
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false, error: "Invalid email or password" };
  await setSessionCookie({ id: user.id, name: user.name, email: user.email });
  return { ok: true };
}

export async function customerLogout(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCustomer(): Promise<CustomerSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as CustomerSession;
  } catch {
    return null;
  }
}
