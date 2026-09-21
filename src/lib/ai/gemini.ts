import "server-only";
import { GEMINI_API_KEY } from "@/lib/server/env";

/**
 * GEMINI CLIENT — server-only, zero extra dependencies.
 *
 * Uses the current Gemini INTERACTIONS API (GA June 2026, recommended for new
 * projects) — verified against ai.google.dev 2026-09:
 *   POST https://generativelanguage.googleapis.com/v1beta/interactions
 *   header: x-goog-api-key
 *   body:   { model, input, system_instruction? }
 * Model is configurable via GEMINI_MODEL; default gemini-3.8-flash (current
 * stable Flash per official docs; gemini-2.x is shut down). The key never
 * leaves the server and is never logged.
 */

export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

const INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const TIMEOUT_MS = 30_000;

export function geminiConfigured(): boolean {
  return GEMINI_API_KEY.length > 0;
}

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly payload?: unknown
  ) {
    super(message);
  }
}

/** Recursively collect model_output text from an Interaction response. */
export function extractInteractionText(payload: unknown): string {
  const out: string[] = [];
  const walk = (node: unknown, inThought: boolean) => {
    if (node === null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const child of node) walk(child, inThought);
      return;
    }
    const obj = node as Record<string, unknown>;
    const t = typeof obj.type === "string" ? obj.type : "";
    const nextThought = inThought || t === "thought" || t === "thought_summary" || t.includes("thought");
    if (typeof obj.text === "string" && !nextThought && obj.text.trim()) {
      out.push(obj.text);
    }
    for (const value of Object.values(obj)) {
      if (value && typeof value === "object") walk(value, nextThought);
    }
  };
  walk(payload, false);
  // De-duplicate overlapping prefixes; join in order.
  const seen = new Set<string>();
  return out.filter((t) => (seen.has(t) ? false : (seen.add(t), true))).join("\n").trim();
}

interface GeminiResult {
  text: string;
  model: string;
  interactionId?: string;
}

/** One POST to the Interactions API (no retry logic inside). */
async function postInteractions(systemInstruction: string, input: string): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(INTERACTIONS_URL, {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        system_instruction: systemInstruction,
        input,
      }),
      signal: controller.signal,
    });
    const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const detail = JSON.stringify(payload).slice(0, 200);
      throw new GeminiError(
        `Gemini API error (${res.status})${detail ? `: ${detail}` : ""}`,
        res.status,
        payload
      );
    }
    return payload;
  } catch (e) {
    if (e instanceof GeminiError) throw e;
    if ((e as Error).name === "AbortError") throw new GeminiError("Gemini request timed out.");
    throw new GeminiError((e as Error).message || "Gemini request failed.");
  } finally {
    clearTimeout(timer);
  }
}

export async function askGemini(systemInstruction: string, input: string): Promise<GeminiResult> {
  if (!geminiConfigured()) throw new GeminiError("GEMINI_API_KEY is not configured.");
  let payload: Record<string, unknown>;
  try {
    payload = await postInteractions(systemInstruction, input);
  } catch (e) {
    // Free-tier limits: 5 requests/minute (and a daily cap). A single
    // backoff-and-retry honoring the API's retry hint keeps bursty consecutive
    // calls (health probe + analyst) from failing the UX.
    if (e instanceof GeminiError && e.status === 429) {
      const m = e.message.match(/retry in (\d+)s/i);
      const wait = Math.min(Math.max(m ? Number(m[1]) * 1000 + 1500 : 12_000, 12_000), 40_000);
      await new Promise((r) => setTimeout(r, wait));
      try {
        payload = await postInteractions(systemInstruction, input); // one retry only
      } catch (retryError) {
        console.error(
          "[memeos:gemini] retry also failed — falling back to rule engine:",
          retryError instanceof Error ? retryError.message : retryError
        );
        throw retryError;
      }
    } else {
      throw e;
    }
  }
  const text = extractInteractionText(payload);
  if (!text) {
    console.error("[memeos:gemini] 200 response but no model text extracted — shape mismatch.");
    throw new GeminiError("Gemini returned an empty response.");
  }
  const interaction = (payload.interaction ?? payload) as Record<string, unknown>;
  return {
    text,
    model: typeof interaction.model === "string" ? interaction.model : GEMINI_MODEL,
    interactionId: typeof interaction.id === "string" ? interaction.id : undefined,
  };
}

/** Real connectivity probe (tiny request) — used by health + smoke tests. */
export async function probeGemini(): Promise<boolean> {
  try {
    const r = await askGemini(
      "You are a connectivity probe. Reply with exactly: OK",
      "Reply with exactly: OK"
    );
    return r.text.toUpperCase().includes("OK");
  } catch {
    return false;
  }
}
