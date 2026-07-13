import { SessionProvider } from "next-auth/react";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <SessionProvider>
      <ChangePasswordForm />
    </SessionProvider>
  );
}
