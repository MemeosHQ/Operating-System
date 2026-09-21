import { describe, it, expect } from "vitest";

/**
 * REAL database integration tests against the configured DATABASE_URL.
 * Gated behind RUN_DB_TESTS=1 so plain CI never mutates the database.
 * Every test uses a `dbtest:` marker and cleans its own rows — no resets,
 * no destructive operations.
 */

const RUN = process.env.RUN_DB_TESTS === "1";
const d = describe.skipIf(!RUN);

// Config self-tests always run.
describe("database configuration gating", () => {
  it("reports DATABASE_URL presence correctly", async () => {
    const mod = await import("../src/lib/server/env");
    const configured = Boolean(process.env.DATABASE_URL?.trim());
    expect(mod.databaseConfigured()).toBe(configured);
  });
});

d("database integration (RUN_DB_TESTS=1)", () => {
  it(
    "connects via a real SELECT 1",
    { timeout: 20_000 },
    async () => {
      const { dbHealthy } = await import("../src/lib/server/db");
      expect(await dbHealthy()).toBe(true);
    }
  );

  it(
    "writes and reads a token snapshot round-trip",
    { timeout: 30_000 },
    async () => {
      const { prisma } = await import("../src/lib/server/db");
      const marker = `dbtest-${Date.now()}`;
      const address = `DBTEST${marker}AAAAAAAAAAAAAAAAAAAAAAAAAAAAA`.slice(0, 44);
      const token = await prisma.token.create({
        data: {
          address,
          ticker: "DBT",
          name: "Database integration test token",
          narrativeTag: "meta",
          sourceMode: "LIVE",
          source: marker,
        },
      });
      const snap = await prisma.tokenSnapshot.create({
        data: {
          tokenId: token.id,
          priceUsd: 0.001,
          marketCapUsd: 12_345,
          liquidityUsd: 1_234,
          volume24hUsd: 555,
          priceChange24hPct: 12.5,
          holders: 42,
          holdersIsProxy: false,
          sourceMode: "LIVE",
          source: marker,
        },
      });
      const readBack = await prisma.tokenSnapshot.findFirst({
        where: { id: snap.id },
      });
      expect(readBack?.marketCapUsd).toBe(12_345);
      expect(readBack?.holders).toBe(42);
      // cleanup — only our own test rows
      await prisma.token.delete({ where: { id: token.id } });
      expect(await prisma.tokenSnapshot.findFirst({ where: { id: snap.id } })).toBeNull();
    }
  );

  it(
    "persists a launch + observed events and reads them back",
    { timeout: 30_000 },
    async () => {
      const { prisma } = await import("../src/lib/server/db");
      const address = `DBTEV${Date.now()}AAAAAAAAAAAAAAAAAAAAAAAAAA`.slice(0, 44).padEnd(44, "A");
      const launch = await prisma.launch.create({
        data: {
          address,
          ticker: "$DBT",
          name: "db test launch",
          status: "new",
          narrativeTag: "meta",
          sourceMode: "LIVE",
          source: "dbtest",
          createdAtMs: BigInt(Date.now()),
        },
      });
      await prisma.launchEvent.create({
        data: { launchId: launch.id, tSeconds: 4, kind: "buyers", label: "First buyer", sourceMode: "LIVE" },
      });
      const readBack = await prisma.launch.findUnique({
        where: { address },
        include: { events: true },
      });
      expect(readBack?.events.length).toBe(1);
      expect(readBack?.events[0].tSeconds).toBe(4);
      await prisma.launch.delete({ where: { id: launch.id } });
    }
  );

  it(
    "persists wallet activity + an evidence-backed relationship",
    { timeout: 30_000 },
    async () => {
      const { persistWalletActivity, readWalletGraph } = await import("../src/lib/server/intel");
      const wallet = `DBTW${Date.now()}AAAAAAAAAAAAAAAAAAAAAAAAAAAA`.slice(0, 44).padEnd(44, "A");
      const mint = `DBTM${Date.now()}AAAAAAAAAAAAAAAAAAAAAAAAAAAA`.slice(0, 44).padEnd(44, "A");
      await persistWalletActivity(wallet, 1.5, [
        { signature: `sig-${Date.now()}`, mint, solAmount: 2, tokenAmount: 1_000, timestamp: Date.now(), kind: "buy" },
      ]);
      const graph = await readWalletGraph(wallet);
      expect(graph).not.toBeNull();
      expect(graph!.edges.length).toBe(1);
      expect(graph!.edges[0].relType).toBe("wallet-token");
      expect(graph!.edges[0].evidence).toContain("buy");
      // cleanup
      const { prisma } = await import("../src/lib/server/db");
      const w = await prisma.wallet.findUnique({ where: { address: wallet } });
      if (w) await prisma.wallet.delete({ where: { id: w.id } });
      await prisma.token.deleteMany({ where: { address: mint } });
    }
  );

  it(
    "persists and reads a server-side watchlist item",
    { timeout: 30_000 },
    async () => {
      const { watchlistAdd, watchlistItems, watchlistRemove } = await import("../src/lib/server/history");
      const wallet = `DBTWL${Date.now()}AAAAAAAAAAAAAAAAAAAAAAAAAAA`.slice(0, 44).padEnd(44, "A");
      await watchlistAdd(wallet, { kind: "token", id: "test-token", label: "DB test" });
      const items = await watchlistItems(wallet);
      expect(items?.some((i) => i.id === "test-token")).toBe(true);
      await watchlistRemove(wallet, "token", "test-token");
      const after = await watchlistItems(wallet);
      expect(after?.some((i) => i.id === "test-token")).toBe(false);
    }
  );

  it(
    "reports database unavailability honestly when the URL is broken",
    { timeout: 30_000 },
    async () => {
      // Construct a client against an unreachable URL and expect failure.
      const { PrismaClient } = await import("@prisma/client");
      const bad = new PrismaClient({
        datasources: { db: { url: "postgresql://invalid:invalid@127.0.0.1:1/none" } },
      });
      let failed = false;
      try {
        await bad.$queryRaw`SELECT 1`;
      } catch {
        failed = true;
      }
      await bad.$disconnect().catch(() => undefined);
      expect(failed).toBe(true);
    }
  );
});
