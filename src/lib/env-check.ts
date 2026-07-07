export function runtimeEnvStatus() {
  return {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    NEXTAUTH_SECRET: !!(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET),
    NEXTAUTH_URL: !!(process.env.NEXTAUTH_URL || process.env.AUTH_URL),
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: !!process.env.ADMIN_PASSWORD_HASH,
  };
}

export function missingRuntimeEnv(): string[] {
  const status = runtimeEnvStatus();
  return (Object.entries(status) as [keyof typeof status, boolean][])
    .filter(([, ok]) => !ok)
    .map(([name]) => name);
}
