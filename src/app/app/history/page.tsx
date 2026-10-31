import { getCurrentUser, DEFAULT_USER } from "@/server/auth";
import { listVerifications } from "@/server/queries";
import { HistoryView } from "@/components/history-view";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = (await getCurrentUser()) ?? DEFAULT_USER;

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const pageParam = typeof sp.page === "string" ? Number(sp.page) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  const result = await listVerifications(user.id, { q, page });

  return (
    <HistoryView
      items={result.items}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      query={q}
    />
  );
}
