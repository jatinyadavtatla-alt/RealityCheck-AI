import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  jsonError,
  jsonOk,
  parseJsonBody,
  sanitizeText,
  withErrorGuard,
} from "@/server/http";
import { hashPassword, setSessionCookie } from "@/server/auth";
import { registerSchema } from "@/server/validators";
import { rateLimit } from "@/server/rate-limit";

export const POST = withErrorGuard(async (req: Request) => {
  const parsed = await parseJsonBody(req, registerSchema);
  if ("response" in parsed) return parsed.response;
  const { name, email, password } = parsed.data;

  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const rl = rateLimit(`register:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.ok) {
    return jsonError(429, "Too many attempts. Please try again later.", "RATE_LIMITED");
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing[0]) {
    return jsonError(409, "An account with this email already exists.", "EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(password);
  const inserted = await db
    .insert(users)
    .values({ name: sanitizeText(name), email, passwordHash })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    });

  const user = inserted[0];
  await setSessionCookie(user.id);
  return jsonOk({ user }, { status: 201 });
});
