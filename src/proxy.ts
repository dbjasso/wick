import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// En Next.js 16 el middleware pasó a llamarse "proxy". Protege todas las
// páginas excepto /login. Las API routes se protegen dentro de cada handler
// (ver lib/session.ts) para poder devolver 401 en vez de un redirect.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api|login|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
