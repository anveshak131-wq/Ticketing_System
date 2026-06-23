import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env as CloudflareEnv;
}

export const KV_KEYS = {
  catalog: "catalog",
  reservations: "reservations",
  users: "users",
  seatInventory: "seat_inventory",
  waitlist: "waitlist",
  pricingRules: "pricing_rules",
} as const;

export const SESSION_PREFIX = "session:";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export async function kvGet<T>(key: string): Promise<T | null> {
  const env = await getEnv();
  const raw = await env.TICKETING_KV.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function kvPut(key: string, value: unknown): Promise<void> {
  const env = await getEnv();
  await env.TICKETING_KV.put(key, JSON.stringify(value));
}

export async function sessionGet(sessionId: string): Promise<string | null> {
  const env = await getEnv();
  return env.TICKETING_SESSIONS.get(`${SESSION_PREFIX}${sessionId}`);
}

export async function sessionPut(sessionId: string, data: unknown): Promise<void> {
  const env = await getEnv();
  await env.TICKETING_SESSIONS.put(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify(data),
    { expirationTtl: SESSION_TTL_SECONDS }
  );
}

export async function sessionDelete(sessionId: string): Promise<void> {
  const env = await getEnv();
  await env.TICKETING_SESSIONS.delete(`${SESSION_PREFIX}${sessionId}`);
}
