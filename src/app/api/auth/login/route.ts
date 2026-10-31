import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  jsonError,
  jsonOk,
  parseJsonBody,
  withErrorGuard,
} from "@/server/http";
import { setSessionCookie, verifyPassword } from "@/server/auth";
import { loginSchema } from "@/server/validators";
import { rateLimit } from "@/server/rate-limit";

export const POST = withErrorGuard(async (req: Request) => {
  const parsed = await parseJsonBody(req, loginSchema);
  if ("response" in parsed) return parsed.response;
  const { email, password } = parsed.data;

  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const rl = rateLimit(`login:${ip}`, 30, 60 * 60 * 1000);
  if (!rl.ok) {
    return jsonError(429, "Too many attempts. Please try again later.", "RATE_LIMITED");
  }

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return jsonError(401, "Incorrect email or password.", "BAD_CREDENTIALS");
  }

  await setSessionCookie(user.id);
  return jsonOk({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});
