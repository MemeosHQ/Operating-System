"use client";

import Link from "next/link";
import {
  LayoutGrid,
  Radio,
  Activity,
  Dna,
  Wallet,
  Waypoints,
  Users,
  Bot,
  FlaskConical,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Command Rail data + item renderers (shared by collapsed and expanded layers). */

export interface RailItemDef {
  href: string;
  label: string;
  icon: (p: { size?: number; strokeWidth?: number; className?: string }) => React.ReactNode;
  /** Tiny per-item signal detail (used sparingly). */
  signal?: "live";
}

export const RAIL_GROUPS: { label: string; items: RailItemDef[] }[] = [
  {
    label: "Discover",
    items: [
      { href: "/terminal", label: "Overview", icon: LayoutGrid },
      { href: "/live", label: "Live", icon: Radio, signal: "live" },
      { href: "/attention", label: "Attention", icon: Activity },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/dna", label: "Meme DNA", icon: Dna },
      { href: "/wallets", label: "Wallets", icon: Wallet },
      { href: "/narratives", label: "Narratives", icon: Waypoints },
    ],
  },
  {
    label: "Ecosystem",
    items: [
      { href: "/creators", label: "Creators", icon: Users },
      { href: "/agents", label: "Agents", icon: Bot },
      { href: "/launches", label: "Launches", icon: FlaskConical },
      { href: "/watchlist", label: "Watchlist", icon: Bookmark },
    ],
  },
];

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** Collapsed rail icon — animated energy line + illuminated dot on active. */
export function RailIcon({
  item,
  pathname,
}: {
  item: RailItemDef;
  pathname: string;
}) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className="group/item relative flex h-10 w-10 items-center justify-center rounded-lg"
    >
      {/* animated vertical energy line */}
      <span
        aria-hidden
        className={cn(
          "absolute -left-2 top-1/2 w-[2px] -translate-y-1/2 rounded-full bg-gradient-to-b from-accent-soft to-signal transition-all duration-200",
          active
            ? "h-5 opacity-100 shadow-[0_0_10px_rgba(123,97,255,0.75)]"
            : "h-0 opacity-0 group-hover/item:h-3 group-hover/item:opacity-40"
        )}
      />
      <Icon
        size={16}
        strokeWidth={1.7}
        className={cn(
          "transition-colors duration-150",
          active ? "text-ink" : "text-muted group-hover/item:text-ink"
        )}
      />
      {item.signal === "live" && (
        <span className="live-dot absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-live" />
      )}
      {active && (
        <span className="absolute right-1.5 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-signal shadow-[0_0_6px_rgba(56,189,248,0.9)]" />
      )}
    </Link>
  );
}

/** Expanded row — icon + label + the same energy line language. */
export function RailRow({
  item,
  pathname,
}: {
  item: RailItemDef;
  pathname: string;
}) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="group/row relative flex items-center gap-3 py-[7px] pl-5 pr-4"
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1/2 w-[2px] -translate-y-1/2 rounded-full bg-gradient-to-b from-accent-soft to-signal transition-all duration-200",
          active
            ? "h-5 opacity-100 shadow-[0_0_10px_rgba(123,97,255,0.75)]"
            : "h-0 opacity-0 group-hover/row:h-3 group-hover/row:opacity-40"
        )}
      />
      <Icon
        size={15}
        strokeWidth={1.7}
        className={cn("shrink-0 transition-colors", active ? "text-ink" : "text-muted group-hover/row:text-ink")}
      />
      <span
        className={cn(
          "text-[13px] transition-colors",
          active ? "font-medium text-ink" : "text-muted group-hover/row:text-ink"
        )}
      >
        {item.label}
      </span>
      {item.signal === "live" && (
        <span className="live-dot ml-auto h-1 w-1 rounded-full bg-live" />
      )}
      {active && (
        <span className="ml-auto h-1 w-1 rounded-full bg-signal shadow-[0_0_6px_rgba(56,189,248,0.9)]" />
      )}
    </Link>
  );
}

/** Editorial, muted group label for the expanded layer. */
export function RailGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pb-1 pt-4 text-[8.5px] font-medium uppercase tracking-[0.32em] text-faint/80">
      {children}
    </div>
  );
}
