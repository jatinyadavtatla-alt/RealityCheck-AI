import { jsonOk } from "@/server/http";
import { clearSessionCookie } from "@/server/auth";

export async function POST() {
  await clearSessionCookie();
  return jsonOk({ ok: true });
}
