import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody, requireUser } from "@/server/http";
import { hashPassword, verifyPassword } from "@/server/auth";
import { changePasswordSchema } from "@/server/validators";

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const parsed = await parseJsonBody(req, changePasswordSchema);
  if ("response" in parsed) return parsed.response;

  const rows = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, auth.user.id))
    .limit(1);
  const row = rows[0];
  if (!row) return jsonError(404, "Account not found.", "NOT_FOUND");

  const ok = await verifyPassword(parsed.data.currentPassword, row.passwordHash);
  if (!ok) {
    return jsonError(400, "Your current password is incorrect.", "BAD_PASSWORD");
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, auth.user.id));
  return jsonOk({ ok: true });
}
