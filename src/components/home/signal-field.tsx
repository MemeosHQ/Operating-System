import { MemeosMark } from "@/components/brand/memeos-logo";

/**
 * SIGNAL FIELD — deterministic, CSS-only atmospheric layer for the hero.
 * Layered arcs + drifting micro-points echoing the hero artwork. Zero JS,
 * reduced-motion safe (static render). Purely decorative.
 */
export function SignalField() {
  const pts = Array.from({ length: 42 }, (_, i) => {
    const x = ((i * 173) % 100) + (i % 3) * 1.7;
    const y = ((i * 97) % 88) + 4;
    const s = 0.6 + ((i * 13) % 10) / 9;
    const o = 0.08 + ((i * 7) % 10) / 28;
    return { x, y, s, o, i };
  });
  return (
    <div aria-hidden className="pointer-events-none relative h-40 select-none md:h-56">
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {[0, 1, 2, 3].map((l) => (
          <path
            key={l}
            d={`M -2 ${20 + l * 3} C 25 ${12 + l * 4}, 55 ${30 - l * 3}, 102 ${16 + l * 2}`}
            fill="none"
            stroke="#7B61FF"
            strokeOpacity={0.05 + l * 0.015}
            strokeWidth="0.15"
          />
        ))}
        {pts.map((p) => (
          <circle
            key={p.i}
            cx={p.x}
            cy={p.y * 0.4 + 6}
            r={p.s * 0.14}
            fill={p.i % 9 === 0 ? "#67E8F9" : "#A855F7"}
            fillOpacity={p.o}
          />
        ))}
      </svg>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.16]">
        <MemeosMark height={38} />
      </div>
    </div>
  );
}
