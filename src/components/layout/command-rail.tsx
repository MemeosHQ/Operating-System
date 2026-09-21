"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";
import { MemeosMark, MemeosWordmark } from "@/components/brand/memeos-logo";
import type { HealthReport } from "@/lib/types";
import { RAIL_GROUPS, RailIcon, RailRow, RailGroupLabel, isActivePath } from "./rail-groups";

/**
 * MEMEOS COMMAND RAIL — the navigation identity.
 * 64px icon rail expanding to ~224px as an overlay on hover/focus (main
 * content never shifts). Grouped DISCOVER / INTELLIGENCE / ECOSYSTEM,
 * energy-line active states, ✦ MEMEOS AI control, real network status.
 */
export function CommandRail() {
  const pathname = usePathname();
  const { data: health } = useApi<HealthReport>("/api/health", { refreshMs: 30_000 });

  return (
    <aside className="group/rail sticky top-0 z-40 hidden h-screen w-16 shrink-0 md:block">
      {/* ── Collapsed rail (always visible) ── */}
      <div className="flex h-full w-16 flex-col items-center border-r border-edge/70 bg-[#07090c] py-4">
        <Link
          href="/"
          title="MEMEOS"
          aria-label="MEMEOS home"
          className="flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-80"
        >
          <MemeosMark height={16} />
        </Link>

        <nav aria-label="Primary" className="mt-5 flex flex-1 flex-col items-center gap-1 overflow-hidden">
          {RAIL_GROUPS.map((g, gi) => (
            <div key={g.label} className="flex flex-col items-center gap-1">
              {gi > 0 && <span aria-hidden className="my-1.5 h-px w-5 bg-edge/80" />}
              {g.items.map((item) => (
                <RailIcon key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          ))}
        </nav>

        {/* bottom cluster */}
        <div className="flex flex-col items-center gap-2.5">
          <RailAiCollapsed pathname={pathname} />
          <RailSettingsCollapsed pathname={pathname} />
          <RailNetworkCollapsed health={health ?? undefined} />
        </div>
      </div>
      <ExpandedOverlay pathname={pathname} health={health ?? undefined} />
    </aside>
  );
}

/* ── Expanded overlay (hover / keyboard focus) ───────────────────────── */

function ExpandedOverlay({
  pathname,
  health,
}: {
  pathname: string;
  health?: HealthReport;
}) {
  const rpcOk = health?.rpc === "connected";
  return (
    <div
      className={cn(
        "pointer-events-none invisible absolute inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-edge bg-[#07090c]/95 opacity-0 shadow-[8px_0_32px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-200 -translate-x-2",
        "group-hover/rail:pointer-events-auto group-hover/rail:visible group-hover/rail:translate-x-0 group-hover/rail:opacity-100",
        "group-focus-within/rail:pointer-events-auto group-focus-within/rail:visible group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100"
      )}
    >
      <div className="px-5 pb-1 pt-5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="MEMEOS home">
          <MemeosWordmark height={12} />
        </Link>
        <div className="mt-1 text-[8.5px] font-medium uppercase tracking-[0.34em] text-faint">
          Meme Intelligence
        </div>
      </div>

      <nav className="mt-3 flex-1 overflow-y-auto pb-3">
        {RAIL_GROUPS.map((g, gi) => (
          <div key={g.label}>
            {gi > 0 && <div aria-hidden className="mx-5 my-2 h-px bg-edge/70" />}
            <RailGroupLabel>{g.label}</RailGroupLabel>
            {g.items.map((item) => (
              <RailRow key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-edge/70 px-3 py-3">
        <Link
          href="/ai"
          className={cn(
            "group/ai mb-1 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
            isActivePath(pathname, "/ai")
              ? "border-signal/50 bg-signal/10 text-signal"
              : "border-accent/30 bg-accent/10 text-accent-soft hover:border-signal/40 hover:text-signal"
          )}
        >
          <span className="ai-glow rounded-full text-[15px] leading-none">✦</span>
          <span className="text-[12px] font-semibold uppercase tracking-[0.16em]">MEMEOS AI</span>
        </Link>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] transition-colors",
            isActivePath(pathname, "/settings") ? "text-ink" : "text-faint hover:text-muted"
          )}
        >
          <Settings size={13} strokeWidth={1.7} /> Settings
        </Link>
        <div className="mt-2 flex items-center gap-2.5 px-3 font-mono text-[9.5px] uppercase tracking-[0.2em] text-faint">
          <Radar size={12} strokeWidth={1.7} />
          <span>SOLANA</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                health ? (rpcOk ? "bg-live live-dot" : "bg-down") : "bg-faint"
              )}
            />
            {health ? (rpcOk ? "Connected" : "Down") : "…"}
          </span>
        </div>
      </div>
    </div>
  );
}

function RailAiCollapsed({ pathname }: { pathname: string }) {
  return (
    <Link
      href="/ai"
      title="MEMEOS AI"
      aria-label="Open MEMEOS AI"
      className={cn(
        "ai-glow flex h-9 w-9 items-center justify-center rounded-full border text-[14px] transition-colors",
        isActivePath(pathname, "/ai")
          ? "border-signal/60 bg-signal/15 text-signal"
          : "border-accent/40 bg-accent/10 text-accent-soft hover:text-signal"
      )}
    >
      ✦
    </Link>
  );
}

function RailSettingsCollapsed({ pathname }: { pathname: string }) {
  return (
    <Link
      href="/settings"
      title="Settings"
      aria-label="Settings"
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        isActivePath(pathname, "/settings") ? "text-ink" : "text-faint hover:text-muted"
      )}
    >
      <Settings size={14} strokeWidth={1.7} />
    </Link>
  );
}

function RailNetworkCollapsed({ health }: { health?: HealthReport }) {
  const rpcOk = health?.rpc === "connected";
  return (
    <div
      className="flex h-8 w-8 items-center justify-center"
      title={health ? `SOLANA · ${rpcOk ? "Connected" : "Down"} · data ${health.data}` : "SOLANA · checking…"}
      aria-label={`Solana network ${rpcOk ? "connected" : "down"}`}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          health ? (rpcOk ? "bg-live live-dot" : "bg-down") : "bg-faint"
        )}
      />
    </div>
  );
}
