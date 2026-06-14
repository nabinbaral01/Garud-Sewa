"use server";

import { redirect } from "next/navigation";
import { customerLogin, customerSignup, customerLogout } from "@/lib/customer-auth";

function safeNext(next: string): string {
  return next && next.startsWith("/") ? next : "/account";
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = safeNext(String(formData.get("next") || ""));
  const res = await customerLogin(email, password);
  if (!res.ok) redirect(`/account?tab=login&error=${encodeURIComponent(res.error)}&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const phone = String(formData.get("phone") || "");
  const password = String(formData.get("password") || "");
  const next = safeNext(String(formData.get("next") || ""));
  const res = await customerSignup(name, email, phone, password);
  if (!res.ok) redirect(`/account?tab=signup&error=${encodeURIComponent(res.error)}&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function logoutAction() {
  await customerLogout();
  redirect("/account");
}
