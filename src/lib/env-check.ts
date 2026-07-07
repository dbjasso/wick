const RUNTIME_REQUIRED = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD_HASH",
] as const;

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

/** Vars required for the app to serve requests (not migrations). */
export function missingRuntimeEnv(): string[] {
  const status = runtimeEnvStatus();
  return RUNTIME_REQUIRED.filter((name) => !status[name]);
}

/** Optional at runtime; needed only for `prisma migrate deploy`. */
export function missingMigrationEnv(): string[] {
  return runtimeEnvStatus().DIRECT_URL ? [] : ["DIRECT_URL"];
}
