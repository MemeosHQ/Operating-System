"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { cn } from "@/lib/utils";

/**
 * Lightweight chart primitives (lazy-rendered by parent routes).
 * Recharts is client-only and imported here so pages stay cheap.
 */

const STATE_COLOR: Record<string, string> = {
  exploding: "#2fd38a",
  accelerating: "#7b61ff",
  cooling: "#ffb224",
  flat: "#5b616b",
};

/** Compact attention meter — bar + multiplier label. */
export function AttentionSpark({
  value,
  state,
  compact = false,
}: {
  value: number;
  state?: string;
  compact?: boolean;
}) {
  const color = STATE_COLOR[state ?? "flat"] ?? "#5b616b";
  return (
    <div className={cn("flex items-center gap-2", compact ? "w-full" : "w-full")}>
      <div className="h-1 flex-1 overflow-hidden rounded bg-edge">
        <div
          className="h-full rounded transition-all"
          style={{ width: `${Math.min(100, Math.max(2, value))}%`, background: color }}
        />
      </div>
      {!compact && (
        <span className="w-6 shrink-0 font-mono text-[10px] tabular-nums text-muted">
          {value}
        </span>
      )}
    </div>
  );
}

export function AttentionAreaChart({
  data,
  height = 180,
}: {
  data: { label: string; attention: number }[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="attFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7b61ff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#7b61ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="attention"
            stroke="#7b61ff"
            strokeWidth={1.6}
            fill="url(#attFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DnaRadar({
  data,
  height = 300,
}: {
  data: { dimension: string; score: number }[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#1c2027" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "#8b919b", fontSize: 10 }}
          />
          <Radar
            dataKey="score"
            stroke="#7b61ff"
            fill="#7b61ff"
            fillOpacity={0.22}
            strokeWidth={1.6}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriceChart({
  data,
  height = 260,
}: {
  data: { label: string; price: number }[];
  height?: number;
}) {
  const up = data.length > 1 && data[data.length - 1].price >= data[0].price;
  const color = up ? "#2fd38a" : "#ff5d6c";
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={1.6}
            fill="url(#priceFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
