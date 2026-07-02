"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectTo: "/login" })}
      className="rounded-md px-2.5 py-1.5 text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900"
    >
      Salir
    </button>
  );
}
