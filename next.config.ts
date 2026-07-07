import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Headers de seguridad aplicados a todas las rutas.
// ponytail: CSP permite 'unsafe-inline' para script/style porque Next.js inyecta
// scripts inline de hidratación. En dev, React también requiere 'unsafe-eval'
// para callstacks de debugging. Ceiling: un XSS reflejado bypassería el CSP de
// scripts. Upgrade: usar nonces por-request (Next los soporta via `nonce` en
// config) y sacar 'unsafe-inline' de script-src. La defensa principal contra
// XSS stored es la sanitización del contenido TipTap (ver lib/sanitize.ts).
const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // ponytail: /Users/dbjc/package-lock.json made Turbopack pick the wrong root
  // and cache a stale DATABASE_URL in .next dev chunks.
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
