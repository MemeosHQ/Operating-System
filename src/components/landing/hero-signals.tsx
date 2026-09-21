"use client";

import { useEffect, useState } from "react";

const SIGNALS = [
  "$CAT ignites in CATS — attention running 3.1× baseline",
  "notable wallet entered $DOGAI",
  "AI AGENTS narrative accelerating — +184% attention",
  "fresh launch detected · first buyers in 4s",
];

/** Rotating live-signal line under the hero copy (reduced-motion safe). */
export function HeroSignals() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((v) => (v + 1) % SIGNALS.length), 3400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2.5 font-mono text-[11.5px] text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-live live-dot" aria-hidden />
      <span key={i} className="rise-in">
        {SIGNALS[i]}
      </span>
    </div>
  );
}
