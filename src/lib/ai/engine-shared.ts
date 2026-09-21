import type { Evidence } from "@/lib/types";

/**
 * Pure Gemini-response parsing — shared by the engine and tests (no
 * server-only imports so it stays unit-testable).
 */

export function parseAnswerSections(
  text: string,
  fallbackChips: string[] = []
): { sections: Evidence[]; chips: string[] } {
  const sections: Evidence[] = [];
  const chips: string[] = [];
  let current: Evidence["kind"] | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const head = line.replace(/[*_#]/g, "").trim().toLowerCase();
    if (head === "observed") { current = "observed"; continue; }
    if (head === "calculated") { current = "calculated"; continue; }
    if (head === "interpretation") { current = "ai-interpretation"; continue; }
    if (head === "follow-ups") { current = null; continue; }
    const body = line.replace(/^[•\-*\d.]+\s*/, "").trim();
    if (!body) continue;
    if (current === null) {
      if (/^(why|what|who|show|compare|analyze|explain|which)\b/i.test(body) && chips.length < 3) {
        chips.push(body.replace(/\?$/, "") + "?");
      }
      continue;
    }
    const [labelPart, ...rest] = body.split(/[:—]/);
    sections.push({
      kind: current,
      label: rest.length > 0 ? labelPart.trim().slice(0, 60) : current === "ai-interpretation" ? "Interpretation" : "Data",
      value: rest.length > 0 ? rest.join(":").trim() : body,
    });
  }
  return { sections, chips: chips.length > 0 ? chips : fallbackChips };
}
