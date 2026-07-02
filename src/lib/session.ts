import { auth } from "@/auth";

// Helper para proteger API routes. Devuelve la sesión o null; el handler
// decide cómo responder (típicamente 401). Así evitamos que el proxy devuelva
// un redirect (302) sobre una API y podamos mandar 401 limpio.
export async function getSession() {
  const session = await auth();
  return session?.user ? session : null;
}
