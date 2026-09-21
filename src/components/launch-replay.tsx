"use client";

import { useEffect, useState } from "react";
import type { Launch, LaunchEvent } from "@/lib/types";
import { Panel, PanelHeader, Badge } from "@/components/ui/kit";
import { fmtSeconds, fmtUsd, cn, relTime } from "@/lib/utils";

const KIND_ICON: Record<LaunchEvent["kind"], string> = {
  launch: "●",
  buyers: "◆",
  whale: "▲",
  volume: "▲",
  holders: "◆",
  "smart-wallet": "★",
  snapshot: "◉",
  graduation: "↑",
  activity: "·",
};

/** Scrubbable first-60-seconds replay for one launch. */
export function LaunchReplay({ launch }: { launch: Launch }) {
  const events = launch.events ?? [];
  const last = events[events.length - 1];
  const maxT = last ? Math.max(60, last.tSeconds) : 60;
  const [t, setT] = useState(0);
  const visible = events.filter((e) => e.tSeconds <= t);

  // Auto-play until the end; scrubbing pauses it.
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setT((x) => {
        const next = Math.min(maxT, x + 2);
        if (next >= maxT) setAuto(false);
        return next;
      });
    }, 90);
    return () => clearInterval(id);
  }, [auto, maxT]);

  return (
    <Panel>
      <PanelHeader
        title={`${launch.ticker} — ${launch.name}`}
        sub={`${relTime(launch.createdAtMs)} · ${fmtUsd(launch.marketCapUsd)} MC · ${launch.status}`}
        right={
          <div className="flex items-center gap-2">
            <Badge tone={launch.status === "graduated" ? "up" : "neutral"}>{launch.status}</Badge>
            <button
              onClick={() => {
                setT(0);
                setAuto(true);
              }}
              className="rounded border border-edge2 px-2 py-0.5 font-mono text-[10px] uppercase text-muted hover:border-accent hover:text-accent-soft"
            >
              replay
            </button>
          </div>
        }
      />
      <div className="p-4">
        <input
          type="range"
          min={0}
          max={maxT}
          value={t}
          onChange={(e) => {
            setAuto(false);
            setT(Number(e.target.value));
          }}
          className="w-full accent-[#7b61ff]"
          aria-label="Scrub launch timeline"
        />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-faint">
          <span>00:00</span>
          <span className="text-accent-soft">{fmtSeconds(t)}</span>
          <span>{fmtSeconds(maxT)}</span>
        </div>
        <div className="mt-3 space-y-1.5">
          {visible.map((e, i) => (
            <div key={i} className="rise-in flex items-start gap-3 rounded-md bg-surface2/50 px-3 py-2">
              <span className="w-11 shrink-0 font-mono text-[11px] tabular-nums text-faint">
                {fmtSeconds(e.tSeconds)}
              </span>
              <span className={cn("mt-0.5 shrink-0 font-mono text-[12px]", e.kind === "whale" || e.kind === "smart-wallet" ? "text-accent-soft" : "text-muted")}>
                {KIND_ICON[e.kind]}
              </span>
              <div className="min-w-0">
                <div className="text-[13px] text-ink">{e.label}</div>
                {e.detail && <div className="text-[11px] text-faint">{e.detail}</div>}
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="py-6 text-center text-[12px] text-faint">Scrub or press replay to run the launch.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
