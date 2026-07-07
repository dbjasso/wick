import type { NextAuthConfig } from "next-auth";

// Config edge-safe (sin acceso a Node APIs ni a la DB). La usa el proxy.
// Los providers se agregan en src/auth.ts (Node-only).
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      if (path.startsWith("/login")) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
