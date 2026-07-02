"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { getClientIp } from "@/lib/get-ip";
import { rateLimit } from "@/lib/auth-rate-limit";

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const ip = await getClientIp();
  if (rateLimit(ip).blocked) {
    return { error: "Demasiados intentos fallidos. Intenta de nuevo en unos minutos." };
  }

  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      totp: String(formData.get("totp") ?? ""),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // authorize ya registró el fallo. Si con este se cruzó el umbral,
      // mostramos el mensaje de bloqueo.
      if (rateLimit(ip).blocked) {
        return { error: "Demasiados intentos fallidos. Intenta de nuevo en unos minutos." };
      }
      return { error: "Correo o contraseña incorrectos. Intenta de nuevo." };
    }
    // Cualquier otro error es la redirección NEXT_REDIRECT que signIn lanza
    // tras un login exitoso: la relanzamos para que Next la ejecute.
    throw error;
  }
}
