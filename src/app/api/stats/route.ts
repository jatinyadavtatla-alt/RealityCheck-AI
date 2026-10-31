import { jsonOk, requireUser } from "@/server/http";
import { getDashboardStats } from "@/server/queries";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const stats = await getDashboardStats(auth.user.id);
  return jsonOk(stats);
}
