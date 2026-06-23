"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth/session";

export interface LoginState {
  error?: string;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const ok = await createSession(email, password);
  if (!ok) {
    // Generic message — never reveal whether the email exists.
    return { error: "Credenciales inválidas." };
  }
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
