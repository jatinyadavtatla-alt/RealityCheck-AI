import "server-only";
import { NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { DEFAULT_USER, getCurrentUser, type SessionUser } from "@/server/auth";

export function jsonError(
  status: number,
  message: string,
  code?: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: message, code: code ?? null, ...extra },
    { status }
  );
}

export function jsonOk<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

/** Returns the active session user (auth is removed for now, never unauthorized). */
export async function requireUser(): Promise<
  { user: SessionUser } | { response: NextResponse }
> {
  const user = await getCurrentUser();
  return { user: user ?? DEFAULT_USER };
}

export async function parseJsonBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      response: jsonError(400, "Request body must be valid JSON.", "BAD_JSON"),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path?.length ? `${first.path.join(".")}: ` : "";
    return {
      response: jsonError(
        400,
        `${where}${first?.message ?? "Invalid request."}`,
        "VALIDATION"
      ),
    };
  }
  return { data: parsed.data };
}

/**
 * Wrap a route handler so unexpected failures become sanitized JSON 500s
 * instead of empty error pages. Never leaks stack traces to clients.
 */
export function withErrorGuard<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
): (...args: T) => Promise<Response> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error("[api] unhandled error:", err);
      const message =
        err instanceof Error && err.message.includes("JWT_SECRET")
          ? "Authentication is misconfigured on this server (JWT_SECRET missing)."
          : "Internal server error. Please try again.";
      return jsonError(500, message, "INTERNAL");
    }
  };
}

/** Strip ASCII control characters from user supplied text. */
export function sanitizeText(value: string): string {
  return value
    .split("")
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .trim();
}
