"use client";

import { useEffect, useState } from "react";
import { MemeosMark, MemeosWordmark } from "@/components/brand/memeos-logo";

/**
 * MEMEOS BOOT LOADER — the intelligence system initializing.
 *
 * Full-screen overlay rendered in the root layout (visible in the first SSR
 * paint, so there is never a flash of the page beneath). Fades out once the
 * app is ready AND a minimum presentation time has passed; a hard failsafe
 * guarantees it can never block the app permanently. Official logo only —
 * geometry untouched.
 *
 * Timing: min 900ms presentation · fade 450ms · failsafe at 4s.
 */

const MIN_PRESENT_MS = 900;
const FAILSAFE_MS = 4000;
const FADE_MS = 450;

export function BootLoader() {
  const [phase, setPhase] = useState<"visible" | "closing" | "gone">("visible");

  useEffect(() => {
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      setPhase("closing");
      window.setTimeout(() => setPhase("gone"), FADE_MS);
    };
    // Ready = window load event (assets settled), respecting the minimum.
    const start = Date.now();
    const onReady = () => {
      const wait = Math.max(0, MIN_PRESENT_MS - (Date.now() - start));
      window.setTimeout(close, wait);
    };
    if (document.readyState === "complete") onReady();
    else window.addEventListener("load", onReady, { once: true });
    // Failsafe — never trap the user behind the loader.
    const failsafe = window.setTimeout(close, FAILSAFE_MS);
    return () => {
      window.removeEventListener("load", onReady);
      window.clearTimeout(failsafe);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      role="status"
      aria-label="MEMEOS is initializing"
      className={cnBoot(phase)}
      aria-hidden={phase === "closing"}
    >
      <div className="m-boot-inner">
        {/* one-time light sweep behind the mark */}
        <div className="m-boot-sweep" aria-hidden />
        <div className="m-boot-logo">
          <MemeosMark height={64} className="m-boot-mark" />
        </div>
        <div className="m-boot-word">
          <MemeosWordmark height={13} />
        </div>
        <div className="m-boot-status">Initializing intelligence</div>
      </div>
    </div>
  );
}

function cnBoot(phase: "visible" | "closing" | "gone") {
  const base =
    "fixed inset-0 z-[100] flex items-center justify-center bg-void";
  if (phase === "closing") return `${base} m-boot-closing`;
  return base;
}
