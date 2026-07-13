import type { NextAuthConfig } from "next-auth";

type Role = "ADMIN" | "MEMBER";

function userFlags(auth: {
  user?: { role?: string; accountId?: string | null; mustChangePassword?: boolean };
} | null) {
  return {
    role: auth?.user?.role,
    accountId: auth?.user?.accountId ?? null,
    mustChangePassword: auth?.user?.mustChangePassword ?? false,
  };
}

// Config edge-safe (sin acceso a Node APIs ni a la DB). La usa el proxy.
// jwt/session viven acá para que el proxy lea role/accountId del token;
// auth.ts solo agrega el trigger "update" (cambio de password).
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.accountId = user.accountId;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as Role | undefined) ?? "MEMBER";
        session.user.accountId = (token.accountId as string | null | undefined) ?? null;
        session.user.mustChangePassword =
          (token.mustChangePassword as boolean | undefined) ?? false;
      }
      return session;
    },
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      if (path.startsWith("/login")) return true;

      const isLoggedIn = !!auth?.user;
      if (!isLoggedIn) return false;

      const { role, accountId, mustChangePassword } = userFlags(auth);

      if (path.startsWith("/admin")) {
        return role === "ADMIN";
      }

      if (path.startsWith("/account/change-password")) {
        if (!mustChangePassword) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      if (mustChangePassword) {
        return Response.redirect(new URL("/account/change-password", request.nextUrl));
      }

      const isJournal =
        !path.startsWith("/admin") && !path.startsWith("/account/change-password");

      if (isJournal && role === "ADMIN" && !accountId) {
        return Response.redirect(new URL("/admin/accounts", request.nextUrl));
      }

      if (isJournal && role === "MEMBER" && !accountId) {
        return false;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
