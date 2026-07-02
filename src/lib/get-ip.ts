import { headers } from "next/headers";

export function ipFromHeaders(h: { get(name: string): string | null }): string {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function getClientIp(): Promise<string> {
  return ipFromHeaders(await headers());
}
