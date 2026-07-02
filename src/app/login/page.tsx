import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  // 2FA TOTP opcional: el campo se muestra sólo si hay secret configurado.
  const twoFactorEnabled = !!process.env.ADMIN_TOTP_SECRET;
  return <LoginForm twoFactorEnabled={twoFactorEnabled} />;
}
