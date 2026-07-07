// ponytail: rate limiter en memoria, ventana deslizante por IP.
// Ceiling: se resetea al reiniciar el server y no se comparte entre instancias
// (en serverless/Vercel cada instancia lleva su propia cuenta). Upgrade: Redis.
const WINDOW_MS = 10 * 60 * 1000; // 10 minutos
// ponytail: en dev permitimos más intentos mientras se prueba el login local.
const MAX_ATTEMPTS = process.env.NODE_ENV === "development" ? 50 : 5;
const attempts = new Map<string, number[]>();

function recentHits(ip: string): number[] {
  const now = Date.now();
  const hits = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, hits);
  return hits;
}

export function rateLimit(ip: string) {
  return { blocked: recentHits(ip).length >= MAX_ATTEMPTS };
}

export function recordFailed(ip: string) {
  const hits = recentHits(ip);
  hits.push(Date.now());
  attempts.set(ip, hits);
}
