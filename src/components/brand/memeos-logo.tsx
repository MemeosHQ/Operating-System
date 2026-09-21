"use client";

import { useId } from "react";

/**
 * OFFICIAL MEMEOS MARK — exact vector reconstruction of the provided logo.
 *
 * Geometry (845×447): three ascending vertical-walled masses on one flat
 * baseline — left block; middle mass with concave valley arc (top-right) and
 * carved arch (bottom-right); tall mass with a convex outer arc from its
 * apex and a carved hook. Two white arches form the negative space.
 * Gradient: indigo → bright orchid → deep violet (purple family only).
 * This is the official mark — geometry is fixed; only color treatment varies.
 */

const MARK_PATHS = [
  "M0 237 H150 V447 H0 Z",
  "M150 79 H265 Q275 215 355 240 V282 Q255 300 210 447 H150 Z",
  "M355 0 A490 447 0 0 1 845 447 H565 Q490 285 448 233 V447 H355 Z",
];

const VIEW = { w: 845, h: 447 };

export type LogoVariant = "gradient" | "gradient-light" | "mono-light" | "mono-dark";

const STOPS: Record<"gradient" | "gradient-light", [string, string][]> = {
  gradient: [
    ["0", "#7C6AF0"],
    ["0.35", "#A855F7"],
    ["0.62", "#C13FE4"],
    ["1", "#43104F"],
  ],
  "gradient-light": [
    ["0", "#6D28D9"],
    ["0.5", "#7E22CE"],
    ["0.78", "#9333EA"],
    ["1", "#3B0764"],
  ],
};

export function MemeosMark({
  height = 24,
  variant = "gradient",
  animated = false,
  className,
  title = "MEMEOS",
}: {
  /** Rendered height; width follows the official 845:447 aspect. */
  height?: number;
  variant?: LogoVariant;
  animated?: boolean;
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const mono = variant === "mono-light" ? "#FFFFFF" : variant === "mono-dark" ? "#0B0D10" : null;
  const gradId = `mm-${uid}`;
  const paint = mono ?? `url(#${gradId})`;
  const defs =
    mono ? null : (
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="0.85" y2="0">
          {STOPS[variant === "gradient-light" ? "gradient-light" : "gradient"].map(([o, c]) => (
            <stop key={o} offset={o} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
    );
  const width = (height * VIEW.w) / VIEW.h;
  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      width={width}
      height={height}
      role="img"
      aria-label={title}
      className={className}
    >
      {defs}
      <path d={MARK_PATHS[0]} fill={paint} />
      <path d={MARK_PATHS[1]} fill={paint} />
      <path d={MARK_PATHS[2]} fill={paint} className={animated ? "m-logo-outer" : undefined} />
    </svg>
  );
}

/** Monoline MEMEOS wordmark — no font dependency, scalable to any size. */
export function MemeosWordmark({
  height = 14,
  color = "#F2F4F8",
  className,
  title = "MEMEOS",
}: {
  height?: number;
  color?: string;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 70.4 16"
      height={height}
      role="img"
      aria-label={title}
      className={className}
    >
      <g fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 1 14.5 V 1.5 L 6 8 L 11 1.5 V 14.5" />
        <path d="M 18.5 1.5 H 11 V 14.5 H 18.5 M 11 8 H 16.5" />
        <path d="M 25.5 14.5 V 1.5 L 30.5 8 L 35.5 1.5 V 14.5" />
        <path d="M 43 1.5 H 35.5 V 14.5 H 43 M 35.5 8 H 41" />
        <path d="M 53 1.7 C 55.8 1.7 57.4 3.2 57.4 8 C 57.4 12.8 55.8 14.3 53 14.3 C 50.2 14.3 48.6 12.8 48.6 8 C 48.6 3.2 50.2 1.7 53 1.7 Z" />
        <path d="M 68.4 3.4 C 68.4 1.9 67 1.5 64.8 1.5 C 62.7 1.5 61.3 2.3 61.3 4 C 61.3 5.9 63 6.4 64.7 6.9 C 66.5 7.4 68.3 7.9 68.3 10 C 68.3 12.3 66.8 14.5 64.7 14.5 C 62.5 14.5 61.2 13.4 61.2 11.8" />
      </g>
    </svg>
  );
}
