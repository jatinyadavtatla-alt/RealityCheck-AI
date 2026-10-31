"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  Layers,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  Modal,
  VerificationStatusChip,
  buttonClasses,
  cx,
} from "@/components/ui";
import { ApiError, apiFetch } from "@/lib/api";
import { formatDate, pluralize } from "@/lib/format";
import { PRODUCT_CATEGORIES, type VerificationSummary } from "@/lib/types";

function categoryLabel(value: string) {
  return PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function HistoryView({
  items,
  total,
  page,
  pageSize,
  query,
}: {
  items: VerificationSummary[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(query);
  const [pendingDelete, setPendingDelete] = useState<VerificationSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function search(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/app/history?${params.toString()}`);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/verifications/${pendingDelete.id}`, {
        method: "DELETE",
      });
      setPendingDelete(null);
      router.refresh();
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : "Delete failed. Try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", String(p));
    return `/app/history?${params.toString()}`;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Evidence Audit History
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {total === 0
              ? "All cross-examined listings and verification dossiers are indexed here."
              : `${total} ${pluralize(total, "audit case")} indexed in the vault.`}
          </p>
        </div>

        <Link
          href="/app/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 px-4.5 py-2.5 text-[13.5px] font-semibold text-white shadow-xs transition hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New Audit</span>
        </Link>
      </div>

      {/* Search Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs">
        <form onSubmit={search} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by product name, description keywords, category..."
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/60 py-2.5 pl-10 pr-10 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  router.push("/app/history");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4.5 py-2.5 text-[13.5px] font-semibold text-white shadow-2xs hover:bg-slate-800 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Verification Items List */}
      {items.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <EmptyState
            icon={<History size={28} className="text-blue-600" />}
            title="No records found"
            body={
              query
                ? `No audits matched "${query}". Try searching with a different keyword.`
                : "Your verification history is empty. Start an audit to inspect listing claims."
            }
            action={
              <Link href="/app/new" className={buttonClasses("primary")}>
                <Plus size={16} /> New Audit
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((v) => {
            const hasDiscrepancy = (v.discrepancyCount ?? 0) > 0;
            return (
              <div
                key={v.id}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Thumbnail */}
                  <div className="relative h-18 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {v.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.thumbnailUrl}
                        alt={v.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <Layers size={20} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-600">
                        {categoryLabel(v.productCategory)}
                      </span>
                      <VerificationStatusChip status={v.status} />
                      <span className="text-[11.5px] text-slate-400">
                        {formatDate(v.createdAt)}
                      </span>
                    </div>

                    <Link
                      href={`/app/verify/${v.id}`}
                      className="block text-[15px] font-bold text-slate-900 hover:text-blue-600 truncate transition"
                    >
                      {v.productName}
                    </Link>

                    {v.status === "completed" && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {hasDiscrepancy ? (
                          <span className="flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                            <ShieldAlert size={12} />
                            {v.discrepancyCount} {pluralize(v.discrepancyCount ?? 0, "discrepancy", "discrepancies")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <ShieldCheck size={12} />
                            Verified match
                          </span>
                        )}

                        {(v.supportedCount ?? 0) > 0 && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                            {v.supportedCount} supported
                          </span>
                        )}
                        {(v.unverifiableCount ?? 0) > 0 && (
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 border border-amber-200/60">
                            {v.unverifiableCount} unverifiable
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link
                    href={`/app/verify/${v.id}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 transition"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight size={14} className="text-slate-400" />
                  </Link>
                  <button
                    onClick={() => setPendingDelete(v)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    title="Delete verification"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 text-[13px] text-slate-500">
          <span>
            Page {page} of {totalPages} ({total} items)
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={pageHref(page - 1)}
              className={cx(
                buttonClasses("secondary", "sm"),
                page <= 1 && "pointer-events-none opacity-40"
              )}
            >
              <ChevronLeft size={14} /> Previous
            </Link>
            <Link
              href={pageHref(page + 1)}
              className={cx(
                buttonClasses("secondary", "sm"),
                page >= totalPages && "pointer-events-none opacity-40"
              )}
            >
              Next <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)}>
        <div className="p-6 space-y-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Delete Verification Record?
            </h3>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">
              &ldquo;{pendingDelete?.productName}&rdquo; will be permanently deleted from the vault.
            </p>
          </div>
          {deleteError && (
            <p className="text-sm font-semibold text-rose-600">{deleteError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
