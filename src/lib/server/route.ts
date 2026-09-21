import "server-only";
import { NextResponse } from "next/server";
import { DataUnavailableError, diagError, toUserFacingError } from "@/lib/errors";

/** Uniform JSON envelope for all MEMEOS API routes. */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; requiredEnv?: string[] };

export async function handleRoute<T>(
  scope: string,
  fn: () => Promise<T>
): Promise<NextResponse<ApiResult<T>>> {
  try {
    const data = await fn();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    diagError(scope, err);
    if (err instanceof DataUnavailableError) {
      return NextResponse.json(
        { ok: false, error: err.message, requiredEnv: err.requiredEnv },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { ok: false, error: toUserFacingError(err) },
      { status: 500 }
    );
  }
}
