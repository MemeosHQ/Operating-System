import "server-only";
import { PrismaClient } from "@prisma/client";
import { DATABASE_URL, databaseConfigured } from "@/lib/server/env";

/**
 * Lazy Prisma singleton — survives Next.js dev hot-reload via globalThis and
 * only constructs when DATABASE_URL is actually configured (so importing this
 * module is safe in any environment). The credential never leaves the server.
 */

type Client = PrismaClient;
const globalForPrisma = globalThis as unknown as { __memeosPrisma?: Client };

function construct(): Client {
  if (!databaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }
  // Bounded pool — Supabase session-mode pooler allows a small max per session.
  let url = DATABASE_URL;
  if (!/[?&]connection_limit=/.test(url)) {
    url += (url.includes("?") ? "&" : "?") + "connection_limit=5&pool_timeout=10";
  }
  const client = new PrismaClient({ datasources: { db: { url } } });
  globalForPrisma.__memeosPrisma = client;
  return client;
}

/** Proxy that constructs the real client on first actual use. */
export const prisma: Client = new Proxy({} as Client, {
  get(_t, prop, receiver) {
    const client = globalForPrisma.__memeosPrisma ?? construct();
    const value = Reflect.get(client as unknown as object, prop, client);
    return typeof value === "function" ? value.bind(client) : value ?? receiver;
  },
});

/** Real connectivity probe — SELECT 1 with a short timeout. */
export async function dbHealthy(): Promise<boolean> {
  if (!databaseConfigured()) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
