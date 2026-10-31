"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleHelp,
  ClipboardList,
  Copy,
  ExternalLink,
  Eye,
  FileCheck2,
  FileDown,
  FileText,
  FileWarning,
  GitCompareArrows,
  ImageIcon,
  Info,
  Maximize2,
  MessagesSquare,
  RefreshCw,
  ScanSearch,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TextQuote,
  Trash2,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  ConfidenceMeter,
  CopyButton,
  Modal,
  StatusPill,
  VerificationStatusChip,
  buttonClasses,
  cx,
} from "@/components/ui";
import { ApiError, apiFetch } from "@/lib/api";
import { formatDateTime, pluralize } from "@/lib/format";
import {
  COMPLETENESS_META,
  DAMAGE_TYPE_LABELS,
  PRODUCT_CATEGORIES,
  type AnalysisResult,
  type ClaimComparison,
  type ClaimStatus,
  type ImageMeta,
  type VerificationStatus,
} from "@/lib/types";
import { AssistantView } from "./assistant-view";

const NL = String.fromCharCode(10);

export interface ReportData {
  verification: {
    id: string;
    productName: string;
    productCategory: string;
    listingUrl: string | null;
    sellerDescription: string;
    additionalDetails: string | null;
    status: string;
    errorMessage: string | null;
    createdAt: string;
  };
  analysis:
    | (AnalysisResult & {
        modelUsed: string;
        durationMs: number | null;
        createdAt: string;
      })
    | null;
  images: ImageMeta[];
  messages?: Array<{ role: "user" | "assistant"; content: string; at: string }>;
}

function categoryLabel(value: string) {
  return PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function SectionHeader({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof Info;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
        <Icon size={17} />
      </span>
      <div>
        <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        {sub && <p className="mt-0.5 text-[12.5px] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

/* ------------------------- High-Res Evidence Lightbox ------------------------- */

function EvidenceLightbox({
  image,
  data,
  onClose,
}: {
  image: ImageMeta | null;
  data: ReportData;
  onClose: () => void;
}) {
  const observations = useMemo(() => {
    if (!image?.ref || !data.analysis) return [];
    return data.analysis.visualObservations.filter(
      (o) => o.imageRef === image.ref
    );
  }, [image, data.analysis]);

  const citing = useMemo(() => {
    if (!image?.ref || !data.analysis) return [];
    return data.analysis.comparisons.filter((c) =>
      c.imageRefs.includes(image.ref ?? "")
    );
  }, [image, data.analysis]);

  if (!image) return null;

  return (
    <Modal open={Boolean(image)} onClose={onClose} wide>
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] overflow-hidden rounded-2xl bg-white">
        <div className="relative flex min-h-[360px] max-h-[75vh] items-center justify-center bg-slate-950 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.fileName}
            className="max-h-[70vh] w-full object-contain rounded-lg"
          />
          <div className="absolute top-4 left-4 rounded-md bg-white/90 backdrop-blur-xs px-2 py-0.5 font-mono text-[11px] font-bold text-slate-900 shadow-sm">
            EVIDENCE {image.ref}
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Visual Inspection Record
              </span>
              <p className="truncate text-[13px] font-semibold text-slate-900">
                {image.fileName}
              </p>
            </div>
            <span className="text-[11px] text-slate-400">
              {Math.round(image.sizeBytes / 1024)} KB
            </span>
          </div>

          <div>
            <h3 className="text-[13.5px] font-bold text-slate-900">
              Gemma 4 Findings on Photo [{image.ref}]
            </h3>
            {observations.length === 0 ? (
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                No specific anomalies or defects tagged on this image. It serves as baseline condition coverage.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {observations.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      {o.damageType && (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10.5px] font-bold text-rose-700">
                          {DAMAGE_TYPE_LABELS[o.damageType]}
                        </span>
                      )}
                      {o.severity && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-800">
                          {o.severity} severity
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-slate-400">
                        {o.location ?? "Overall unit"}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-800 leading-snug">
                      {o.observation}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {citing.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                Claims Contradicted or Supported
              </h4>
              <div className="mt-2 space-y-2">
                {citing.map((c) => (
                  <div
                    key={c.claimId}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-[12px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 truncate">
                        {c.claim}
                      </span>
                      <StatusPill status={c.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ------------------- Split-Pane Comparison Card ------------------- */

function ComparisonCard({
  comparison,
  imagesByRef,
  onInspect,
  index,
}: {
  comparison: ClaimComparison;
  imagesByRef: Map<string, ImageMeta>;
  onInspect: (img: ImageMeta) => void;
  index: number;
}) {
  const isDiscrepancy = comparison.status === "discrepancy";
  const isSupported = comparison.status === "supported";
  const isUnverifiable = comparison.status === "unverifiable";

  const evidenceImages = comparison.imageRefs
    .map((r) => imagesByRef.get(r))
    .filter((x): x is ImageMeta => Boolean(x));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25) }}
      className={cx(
        "group relative overflow-hidden rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md",
        isDiscrepancy
          ? "border-rose-200 bg-white"
          : isSupported
          ? "border-emerald-200 bg-white"
          : "border-slate-200 bg-white"
      )}
    >
      {/* Top Status Header Bar */}
      <div
        className={cx(
          "flex items-center justify-between px-5 py-2.5 border-b text-[12px] font-semibold",
          isDiscrepancy
            ? "bg-rose-50/80 border-rose-100 text-rose-800"
            : isSupported
            ? "bg-emerald-50/80 border-emerald-100 text-emerald-800"
            : "bg-amber-50/80 border-amber-100 text-amber-800"
        )}
      >
        <div className="flex items-center gap-2">
          {isDiscrepancy ? (
            <ShieldAlert size={15} className="text-rose-600" />
          ) : isSupported ? (
            <ShieldCheck size={15} className="text-emerald-600" />
          ) : (
            <CircleHelp size={15} className="text-amber-600" />
          )}
          <span className="font-bold uppercase tracking-wider text-[11px]">
            {isDiscrepancy
              ? "Critical Contradiction Flagged"
              : isSupported
              ? "Verified with Visual Evidence"
              : "Claim Cannot Be Verified from Photos"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10.5px] opacity-75">
            Claim {comparison.claimId}
          </span>
          <ConfidenceMeter confidence={comparison.confidence} />
        </div>
      </div>

      {/* Split-Grid: Left = Seller Claim, Right = Actual Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        {/* Left Column: Seller's Claim */}
        <div className="p-5 space-y-3 bg-slate-50/40">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              <TextQuote size={13} className="text-blue-500" />
              Seller&rsquo;s Stated Claim
            </span>
            {comparison.category && (
              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10.5px] font-medium text-slate-700 capitalize">
                {comparison.category}
              </span>
            )}
          </div>

          <p className="text-[15px] font-bold text-slate-900 leading-snug">
            {comparison.claim}
          </p>

          {comparison.quote && (
            <blockquote className="rounded-xl border border-slate-200/80 bg-white p-3 text-[12.5px] italic text-slate-600 leading-relaxed shadow-2xs">
              &ldquo;{comparison.quote}&rdquo;
            </blockquote>
          )}
        </div>

        {/* Right Column: Actual Visual Proof */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              Actual Visual Evidence
            </span>
            <StatusPill status={comparison.status} />
          </div>

          <p className="text-[13.5px] leading-relaxed text-slate-800">
            {comparison.explanation}
          </p>

          {/* Evidence photo thumbnails */}
          {evidenceImages.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-medium text-slate-400 mb-1.5">
                Citing Evidence Artifacts:
              </p>
              <div className="flex flex-wrap gap-2.5">
                {evidenceImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => onInspect(img)}
                    className="group/img relative overflow-hidden rounded-xl border border-slate-200/90 shadow-2xs transition hover:scale-105 hover:shadow-md focus-ring"
                    title={`Inspect photo [${img.ref}]`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.fileName}
                      className="h-16 w-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center">
                      <Maximize2 size={14} className="text-white drop-shadow-sm" />
                    </div>
                    <span className="absolute bottom-1 left-1 rounded bg-slate-900/85 px-1 py-0.5 font-mono text-[9px] font-bold text-white shadow-xs">
                      {img.ref}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {comparison.limitations && (
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-[11.5px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">Caveat: </span>
              {comparison.limitations}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* --------------------------- Main Report View --------------------------- */

export function ReportView({ data }: { data: ReportData }) {
  const router = useRouter();
  const { verification, analysis, images } = data;
  const [filter, setFilter] = useState<"all" | ClaimStatus>("all");
  const [inspecting, setInspecting] = useState<ImageMeta | null>(null);
  const [activeTab, setActiveTab] = useState<"report" | "assistant">("report");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const imagesByRef = useMemo(() => {
    const map = new Map<string, ImageMeta>();
    for (const img of images) if (img.ref) map.set(img.ref, img);
    return map;
  }, [images]);

  const productImages = images.filter((i) => i.kind === "product");
  const listingImages = images.filter((i) => i.kind === "listing");

  const comparisons = analysis?.comparisons ?? [];
  const counts = {
    all: comparisons.length,
    supported: comparisons.filter((c) => c.status === "supported").length,
    discrepancy: comparisons.filter((c) => c.status === "discrepancy").length,
    unverifiable: comparisons.filter((c) => c.status === "unverifiable").length,
  };

  const filtered =
    filter === "all" ? comparisons : comparisons.filter((c) => c.status === filter);

  const hasDiscrepancies = counts.discrepancy > 0;

  async function remove() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/verifications/${verification.id}`, {
        method: "DELETE",
      });
      router.replace("/app/dashboard");
      router.refresh();
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : "Could not delete this verification."
      );
      setDeleting(false);
    }
  }

  function handleCopyShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }

  const questionsText = (analysis?.followUpQuestions ?? [])
    .map((q, i) => `${i + 1}. ${q.question}`)
    .join(NL);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={15} />
          <span>Evidence Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyShare}
            className={buttonClasses("secondary", "sm")}
          >
            {shareCopied ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Share2 size={14} />
                <span>Share Audit</span>
              </>
            )}
          </button>

          <Link
            href={`/app/verify/${verification.id}/analyze`}
            className={buttonClasses("secondary", "sm")}
          >
            <RefreshCw size={14} />
            <span>Re-run Gemma 4</span>
          </Link>

          <button
            onClick={() => setConfirmDelete(true)}
            className={buttonClasses("ghost", "sm", "text-rose-600 hover:bg-rose-50")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Main Title & Metadata Dossier */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                {categoryLabel(verification.productCategory)}
              </span>
              <VerificationStatusChip
                status={verification.status as VerificationStatus}
              />
              <span className="font-mono text-[11px] text-slate-400">
                Audit #{verification.id.slice(0, 10)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              {verification.productName}
            </h1>

            <p className="text-[13px] text-slate-500">
              Created {formatDateTime(verification.createdAt)}
              {verification.listingUrl && (
                <>
                  {" · "}
                  <a
                    href={verification.listingUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <span>View Listing Source</span>
                    <ExternalLink size={12} />
                  </a>
                </>
              )}
            </p>
          </div>

          {/* Quick Tab Switcher: Report vs AI Assistant */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              onClick={() => setActiveTab("report")}
              className={cx(
                "flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-bold transition",
                activeTab === "report"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <FileCheck2 size={15} />
              <span>Evidence Report</span>
            </button>
            <button
              onClick={() => setActiveTab("assistant")}
              className={cx(
                "flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-bold transition",
                activeTab === "assistant"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <MessagesSquare size={15} />
              <span>AI Buyer Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab: Assistant View */}
      {activeTab === "assistant" && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <AssistantView
            verificationId={verification.id}
            productName={verification.productName}
            initialMessages={data.messages ?? []}
            discrepancyCount={counts.discrepancy}
            supportedCount={counts.supported}
          />
        </div>
      )}

      {/* Tab: Report View */}
      {activeTab === "report" && (
        <>
          {/* No analysis yet */}
          {!analysis ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <ScanSearch size={28} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                Ready for Gemma 4 Multimodal Audit
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
                {productImages.length} actual photos and the seller claims are on file. Run the analysis to generate the report.
              </p>
              <Link
                href={`/app/verify/${verification.id}/analyze`}
                className={buttonClasses("primary", "md", "mt-6")}
              >
                <Zap size={16} />
                <span>Launch Multimodal Analysis</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Executive Verdict Banner (Linear / Apple aesthetic) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cx(
                  "relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-sm",
                  hasDiscrepancies
                    ? "border-rose-200 bg-gradient-to-br from-rose-50/90 via-white to-rose-50/50"
                    : "border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/50"
                )}
              >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={cx(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs",
                        hasDiscrepancies
                          ? "bg-rose-500 text-white"
                          : "bg-emerald-500 text-white"
                      )}
                    >
                      {hasDiscrepancies ? (
                        <ShieldAlert size={26} strokeWidth={2.3} />
                      ) : (
                        <BadgeCheck size={26} strokeWidth={2.3} />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cx(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                            hasDiscrepancies
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          )}
                        >
                          {hasDiscrepancies
                            ? "Contradictions Flagged"
                            : "Verified Authentic & Accurate"}
                        </span>
                        <span className="text-[12px] text-slate-400 font-mono">
                          {COMPLETENESS_META[analysis.overallAssessment.evidenceCompleteness].label}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950">
                        {analysis.overallAssessment.headline}
                      </h2>
                      <p className="text-[14px] leading-relaxed text-slate-600 max-w-2xl">
                        {analysis.overallAssessment.summary}
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="rounded-2xl border border-white bg-white/80 p-3.5 text-center shadow-xs min-w-[90px]">
                      <span className="block text-2xl font-bold text-rose-600">
                        {counts.discrepancy}
                      </span>
                      <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
                        Contradictions
                      </span>
                    </div>

                    <div className="rounded-2xl border border-white bg-white/80 p-3.5 text-center shadow-xs min-w-[90px]">
                      <span className="block text-2xl font-bold text-emerald-600">
                        {counts.supported}
                      </span>
                      <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
                        Supported
                      </span>
                    </div>

                    <div className="rounded-2xl border border-white bg-white/80 p-3.5 text-center shadow-xs min-w-[90px]">
                      <span className="block text-2xl font-bold text-amber-600">
                        {counts.unverifiable}
                      </span>
                      <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
                        Unverified
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Product Visual Identity Overview Card */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
                <SectionHeader
                  icon={ImageIcon}
                  title="Multimodal Hardware Identification"
                  sub="AI visual verification of product brand, form-factor, serial hallmarks and packaging."
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Product Type
                    </span>
                    <p className="mt-1 text-[14px] font-bold text-slate-900">
                      {analysis.productOverview.detectedProductType}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Detected Brand
                    </span>
                    <p className="mt-1 text-[14px] font-bold text-slate-900">
                      {analysis.productOverview.brand ?? "Unspecified"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Detected Model
                    </span>
                    <p className="mt-1 text-[14px] font-bold text-slate-900 truncate">
                      {analysis.productOverview.model ?? "Generic Model"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Evidence Photos
                    </span>
                    <p className="mt-1 text-[14px] font-bold text-blue-600">
                      {productImages.length} {pluralize(productImages.length, "photo")} reviewed
                    </p>
                  </div>
                </div>

                <p className="text-[13.5px] leading-relaxed text-slate-600 pt-1">
                  {analysis.productOverview.summary}
                </p>

                {analysis.productOverview.visibleIdentifiers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[12px] font-semibold text-slate-500">
                      Hallmarks identified:
                    </span>
                    {analysis.productOverview.visibleIdentifiers.map((idTag) => (
                      <span
                        key={idTag}
                        className="rounded-md border border-slate-200 bg-slate-100/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700"
                      >
                        {idTag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CORE SHOWPIECE: Seller Claims vs Actual Evidence */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                  <div>
                    <SectionHeader
                      icon={GitCompareArrows}
                      title="Seller Claims vs. Actual Visual Evidence"
                      sub="Detailed side-by-side audit weighing every stated listing claim against actual raw pixels."
                    />
                  </div>

                  {/* Filter Pills with Linear-style spring */}
                  <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100/90 p-1 border border-slate-200/80 self-start sm:self-auto">
                    {(
                      [
                        ["all", `All Claims (${counts.all})`],
                        ["discrepancy", `Contradictions (${counts.discrepancy})`],
                        ["supported", `Supported (${counts.supported})`],
                        ["unverifiable", `Unverifiable (${counts.unverifiable})`],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={cx(
                          "rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all",
                          filter === key
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comparison Card Stack */}
                <div className="space-y-4 pt-1">
                  {filtered.map((comparison, idx) => (
                    <ComparisonCard
                      key={comparison.claimId}
                      comparison={comparison}
                      imagesByRef={imagesByRef}
                      onInspect={setInspecting}
                      index={idx}
                    />
                  ))}

                  {filtered.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                      No claims found matching this filter criteria.
                    </div>
                  )}
                </div>
              </div>

              {/* Actionable Buyer Guidance & Questions to Ask Seller */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Questions for Seller */}
                {analysis.followUpQuestions.length > 0 && (
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <MessagesSquare size={16} />
                        </span>
                        <h3 className="text-[15px] font-bold text-slate-900">
                          Negotiation & Verification Questions
                        </h3>
                      </div>
                      <CopyButton text={questionsText} label="Copy Questions" />
                    </div>

                    <p className="text-[12.5px] text-slate-500">
                      Send these exact questions to the seller to clarify contradictions before sending payment:
                    </p>

                    <ol className="space-y-3 pt-1">
                      {analysis.followUpQuestions.map((q, i) => (
                        <li
                          key={i}
                          className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 font-mono text-[11px] font-bold text-white shadow-2xs">
                            {i + 1}
                          </span>
                          <div className="space-y-1">
                            <p className="text-[13.5px] font-bold text-slate-900 leading-snug">
                              {q.question}
                            </p>
                            <p className="text-[12px] text-slate-500">
                              {q.why}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Buyer Guidance Playbook */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <ClipboardList size={16} />
                    </span>
                    <h3 className="text-[15px] font-bold text-slate-900">
                      Buyer Protection Playbook
                    </h3>
                  </div>

                  <p className="text-[12.5px] text-slate-500">
                    Recommendations synthesized from the visual evidence and condition score:
                  </p>

                  <ul className="space-y-2.5 pt-1">
                    {analysis.overallAssessment.buyerGuidance.map((guide, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-[13px] text-slate-800 leading-relaxed"
                      >
                        <ArrowRight size={14} className="mt-0.5 shrink-0 text-blue-600" />
                        <span>{guide}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Caveats */}
                  <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50 p-3.5 text-[12px] text-slate-500 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
                      <FileWarning size={13} className="text-amber-500" />
                      <span>Report Limitations:</span>
                    </div>
                    {analysis.overallAssessment.caveats.join(" ")}
                  </div>
                </div>
              </div>

              {/* Photo Evidence Vault Gallery */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
                <SectionHeader
                  icon={ImageIcon}
                  title="Evidence Photo Vault"
                  sub="Raw unedited photos uploaded for this verification. Click any thumbnail for high-resolution inspection."
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                  {productImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setInspecting(img)}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left transition hover:-translate-y-1 hover:shadow-lg focus-ring"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.fileName}
                        className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-2.5 left-2.5 rounded-md bg-slate-900/85 px-2 py-0.5 font-mono text-[10.5px] font-bold text-white shadow-xs">
                        {img.ref}
                      </div>
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="rounded-full bg-white/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-sm flex items-center gap-1">
                          <Eye size={12} /> Inspect
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <div className="p-6 space-y-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Delete Verification Dossier?
            </h3>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">
              &ldquo;{verification.productName}&rdquo;, all evidence photos, AI analysis findings, and assistant conversations will be permanently deleted.
            </p>
          </div>
          {deleteError && (
            <p className="text-sm font-semibold text-rose-600">{deleteError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={remove} loading={deleting}>
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* High-Res Evidence Inspection Lightbox */}
      <EvidenceLightbox
        image={inspecting}
        data={data}
        onClose={() => setInspecting(null)}
      />
    </div>
  );
}
