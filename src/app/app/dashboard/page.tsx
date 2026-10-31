import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  FileCheck2,
  Layers,
  ListChecks,
  Plus,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  CheckCircle2,
  Search,
} from "lucide-react";
import { getCurrentUser, DEFAULT_USER } from "@/server/auth";
import { getDashboardStats } from "@/server/queries";
import {
  ActivityChart,
  BreakdownDonut,
} from "@/components/dashboard-charts";
import { Badge, EmptyState, VerificationStatusChip } from "@/components/ui";
import { buttonClasses } from "@/components/styles";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import { formatRelative, pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";

function categoryLabel(value: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export default async function DashboardPage() {
  const user = (await getCurrentUser()) ?? DEFAULT_USER;
  const stats = await getDashboardStats(user.id);
  const firstName = user.name.split(" ")[0];
  const empty = stats.totals.verifications === 0;

  const totalAssessed = stats.totals.claimsAssessed || 1;
  const catchRate = Math.round((stats.totals.discrepancies / totalAssessed) * 100);

  const cards = [
    {
      label: "Total Audits",
      value: stats.totals.verifications,
      icon: Layers,
      note: "Listings inspected against proof",
      color: "text-blue-600",
      bg: "bg-blue-50/80 border-blue-100",
      trend: "+12% this week",
    },
    {
      label: "Contradictions Flagged",
      value: stats.totals.discrepancies,
      icon: TriangleAlert,
      note: "Seller claims debunked by photos",
      color: "text-rose-600",
      bg: "bg-rose-50/80 border-rose-100",
      accent: stats.totals.discrepancies > 0,
      trend: "Discrepancy alert",
    },
    {
      label: "Verified Evidence",
      value: stats.breakdown.supported,
      icon: CheckCircle2,
      note: "Claims confirmed authentic",
      color: "text-emerald-600",
      bg: "bg-emerald-50/80 border-emerald-100",
      trend: "High confidence",
    },
    {
      label: "Claims Audited",
      value: stats.totals.claimsAssessed,
      icon: ListChecks,
      note: "Micro-claims cross-referenced",
      color: "text-indigo-600",
      bg: "bg-indigo-50/80 border-indigo-100",
      trend: "Gemma 4 Multimodal",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/40 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-3 py-1 text-[11.5px] font-semibold text-blue-700 shadow-2xs backdrop-blur-xs">
              <Sparkles size={13} className="text-blue-600 animate-pulse" />
              <span>Gemma 4 Multimodal Intelligence Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
              Real-time cross-examination of e-commerce listings against raw visual proof. Detect hidden defects, counterfeit traits, and exaggerated seller claims before purchasing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/app/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_14px_rgba(37,99,235,0.3)] transition hover:from-blue-500 hover:to-blue-600 active:scale-[0.98]"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Evidence Audit</span>
            </Link>
          </div>
        </div>

        {/* Ambient subtle glow background */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      {/* 4 Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-slate-500">
                {c.label}
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${c.bg}`}>
                <c.icon size={16} className={c.color} />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className={`text-3xl font-bold tabular-nums tracking-tight ${c.accent ? "text-rose-600" : "text-slate-900"}`}>
                {c.value}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {c.trend}
              </span>
            </div>

            <p className="mt-1 text-[12px] text-slate-400 truncate">
              {c.note}
            </p>
          </div>
        ))}
      </div>

      {empty ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <EmptyState
            icon={<ScanSearch size={28} className="text-blue-600" />}
            title="No evidence audits yet"
            body="Paste any product listing URL or seller description, upload photo evidence, and let Gemma 4 verify claims against actual pixels."
            action={
              <Link href="/app/new" className={buttonClasses("primary")}>
                <Plus size={16} /> Start your first audit
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Analytics Visualizers (Linear / Stripe style) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
            {/* Activity Chart */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
                    Audit Velocity & Throughput
                  </h2>
                  <p className="text-[12px] text-slate-500">
                    Daily evidence cross-examinations over the last 14 days
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  Last 14 Days
                </span>
              </div>
              <div className="pt-4">
                <ActivityChart data={stats.activity} />
              </div>
            </div>

            {/* Claim Contradiction Breakdown */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
                    Fidelity Breakdown
                  </h2>
                  <p className="text-[12px] text-slate-500">
                    Proportion of claims validated vs contradicted
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <BreakdownDonut breakdown={stats.breakdown} />
              </div>
            </div>
          </div>

          {/* Recent Verifications Showcase */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-bold tracking-tight text-slate-900">
                  Recent Verified Cases
                </h2>
                <p className="text-[12.5px] text-slate-500">
                  High-risk items and recent evidence reports
                </p>
              </div>
              <Link
                href="/app/history"
                className="group inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"
              >
                <span>View Full Audit Vault</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {stats.recent.map((v) => {
                const hasDiscrepancy = (v.discrepancyCount ?? 0) > 0;
                return (
                  <Link
                    key={v.id}
                    href={`/app/verify/${v.id}`}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
                  >
                    {/* Thumbnail Image Header */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      {v.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.thumbnailUrl}
                          alt={v.productName}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300">
                          <Layers size={28} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <VerificationStatusChip status={v.status} />
                        {hasDiscrepancy ? (
                          <span className="flex items-center gap-1 rounded-full bg-rose-500/90 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                            <ShieldAlert size={12} />
                            Discrepancy
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                            <ShieldCheck size={12} />
                            Verified
                          </span>
                        )}
                      </div>

                      {/* Product Name overlay */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                          {categoryLabel(v.productCategory)}
                        </p>
                        <h3 className="text-[14.5px] font-bold text-white truncate drop-shadow-xs">
                          {v.productName}
                        </h3>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                      <div className="flex items-center justify-between text-[11.5px] text-slate-400">
                        <span>Audited {formatRelative(v.createdAt)}</span>
                        <span className="font-mono text-slate-500">ID: {v.id.slice(0, 10)}</span>
                      </div>

                      {/* Claim Badges */}
                      {v.status === "completed" && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(v.discrepancyCount ?? 0) > 0 && (
                            <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                              {v.discrepancyCount} {pluralize(v.discrepancyCount ?? 0, "discrepancy", "discrepancies")}
                            </span>
                          )}
                          {(v.supportedCount ?? 0) > 0 && (
                            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              {v.supportedCount} supported
                            </span>
                          )}
                          {(v.unverifiableCount ?? 0) > 0 && (
                            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              {v.unverifiableCount} unverifiable
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[12.5px] font-semibold text-blue-600 group-hover:text-blue-700">
                        <span>Inspect Evidence Report</span>
                        <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
