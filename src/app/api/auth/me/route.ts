import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonOk, parseJsonBody, requireUser, sanitizeText } from "@/server/http";
import { updateProfileSchema } from "@/server/validators";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  return jsonOk({ user: auth.user });
}

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const parsed = await parseJsonBody(req, updateProfileSchema);
  if ("response" in parsed) return parsed.response;

  const name = sanitizeText(parsed.data.name);
  await db.update(users).set({ name }).where(eq(users.id, auth.user.id));
  return jsonOk({ user: { ...auth.user, name } });
}
