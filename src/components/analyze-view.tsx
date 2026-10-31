"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CircleDashed,
  Cpu,
  FileText,
  GitCompareArrows,
  Images,
  KeyRound,
  Loader2,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Terminal,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { buttonClasses, cx } from "@/components/ui";
import { ApiError, streamAnalysis } from "@/lib/api";
import type { AnalysisEvent, AnalysisStage } from "@/lib/types";

const STAGES: {
  id: AnalysisStage;
  label: string;
  doing: string;
  techDetail: string;
  icon: typeof FileText;
}[] = [
  {
    id: "claims",
    label: "Seller Claim Extraction & NLP Decomposition",
    doing: "Extracting checkable assertions from seller description...",
    techDetail: "Parsing condition, accessories, authenticity claims into semantic tuples",
    icon: FileText,
  },
  {
    id: "images",
    label: "Multimodal Visual Feature Mapping",
    doing: "Inspecting actual product photographs at pixel resolution...",
    techDetail: "Evaluating lighting, reflections, serial engravings & OEM finishes",
    icon: Images,
  },
  {
    id: "damage",
    label: "Defect & Micro-Wear Detection",
    doing: "Scanning for scratches, dents, micro-abrasions and cracks...",
    techDetail: "Surface anomaly detection and cosmetic wear classification",
    icon: ScanSearch,
  },
  {
    id: "compare",
    label: "Cross-Modal Evidence Alignment",
    doing: "Cross-referencing stated claims against visual proof...",
    techDetail: "Triangulating contradiction matrices and calculating confidence delta",
    icon: GitCompareArrows,
  },
  {
    id: "report",
    label: "Audit Synthesis & Executive Report",
    doing: "Generating buyer guidance, severity scoring and limitations...",
    techDetail: "Compiling final discrepancy dossier and negotiation leverage",
    icon: ShieldCheck,
  },
];

type StageState = "pending" | "active" | "done";

export function AnalyzeView({
  verificationId,
  productName,
  previousError,
}: {
  verificationId: string;
  productName: string;
  previousError: string | null;
}) {
  const router = useRouter();
  const started = useRef(false);
  const [states, setStates] = useState<Record<AnalysisStage, StageState>>({
    claims: "pending",
    images: "pending",
    damage: "pending",
    compare: "pending",
    report: "pending",
  });
  const [details, setDetails] = useState<Partial<Record<AnalysisStage, string>>>({});
  const [error, setError] = useState<string | null>(previousError);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [running, setRunning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "Initializing Gemma 4 multimodal inference session...",
    "Loading high-resolution image tensors into attention cache...",
  ]);

  function addLog(msg: string) {
    setTerminalLogs((prev) => [...prev.slice(-6), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }

  function onEvent(event: AnalysisEvent) {
    if (event.type === "stage") {
      setStates((s) => ({ ...s, [event.stage]: event.state }));
      if (event.state === "active") {
        addLog(`Started stage: ${event.stage.toUpperCase()}`);
      }
      if (event.state === "done" && event.detail) {
        setDetails((d) => ({ ...d, [event.stage]: event.detail }));
        addLog(`Stage ${event.stage.toUpperCase()} completed: ${event.detail}`);
      }
    } else if (event.type === "complete") {
      setComplete(true);
      addLog(`Analysis pipeline finished in ${Math.round(event.durationMs / 100) / 10}s. Preparing executive report...`);
    } else if (event.type === "error") {
      setError(event.message);
      setErrorCode(event.code ?? null);
      setRunning(false);
      addLog(`Pipeline error: ${event.message}`);
    }
  }

  async function run() {
    setError(null);
    setErrorCode(null);
    setComplete(false);
    setRunning(true);
    setStates({
      claims: "pending",
      images: "pending",
      damage: "pending",
      compare: "pending",
      report: "pending",
    });
    setDetails({});
    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] Connecting to Gemma 4 / Gemini API...`,
      `[${new Date().toLocaleTimeString()}] Processing evidence payload for "${productName}"...`,
    ]);

    try {
      const result = await streamAnalysis(verificationId, onEvent);
      if (result.outcome === "complete") {
        setComplete(true);
        setTimeout(() => {
          router.replace(`/app/verify/${verificationId}`);
          router.refresh();
        }, 1000);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not complete analysis pipeline. Please try again."
      );
      setErrorCode(err instanceof ApiError ? err.code : null);
      setRunning(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = Object.values(states).filter((s) => s === "done").length;
  const progressPct = Math.round((doneCount / 5) * 100);

  return (
    <div className="mx-auto max-w-3xl py-6 sm:py-10 animate-fade-in space-y-6">
      {/* Top back navigation */}
      <Link
        href={`/app/verify/${verificationId}`}
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft size={15} />
        <span>Back to Verification Dossier</span>
      </Link>

      {/* Main Analysis Workspace Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl">
        {/* Workspace Header with Scanning Beam */}
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 px-6 sm:px-8 py-7 text-white">
          {/* Animated Scanning Laser Line */}
          {running && !complete && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[scanline_2.5s_ease-in-out_infinite]" />
            </div>
          )}

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300 backdrop-blur-xs">
                  <Sparkles size={12} className="text-cyan-300 animate-spin" />
                  Gemma 4 Multimodal Scanner
                </span>
                <span className="font-mono text-[11px] text-white/50">
                  ID: {verificationId.slice(0, 12)}
                </span>
              </div>
              <h1 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-xs">
                {productName}
              </h1>
            </div>

            <div className="flex flex-col sm:items-end">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-white">
                  {progressPct}%
                </span>
              </div>
              <span className="text-[11.5px] font-medium text-white/60">
                {complete ? "Report Complete" : `${doneCount} of 5 phases verified`}
              </span>
            </div>
          </div>

          {/* Progress Bar with Gradient Glow */}
          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/15 p-0.5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
              animate={{ width: `${Math.max(5, progressPct)}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* Multi-Stage Step Pipeline */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="space-y-3">
            {STAGES.map((stage, idx) => {
              const state = states[stage.id];
              const isActive = state === "active";
              const isDone = state === "done";
              const isPending = state === "pending";

              return (
                <div
                  key={stage.id}
                  className={cx(
                    "relative flex items-start gap-4 rounded-2xl p-4 transition-all duration-200 border",
                    isActive
                      ? "border-blue-300 bg-blue-50/50 shadow-xs"
                      : isDone
                      ? "border-slate-100 bg-slate-50/40"
                      : "border-transparent opacity-60"
                  )}
                >
                  {/* Step status icon */}
                  <div
                    className={cx(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[13px] font-bold transition-all",
                      isDone
                        ? "border-emerald-300 bg-emerald-500 text-white shadow-xs"
                        : isActive
                        ? "border-blue-400 bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] animate-pulse"
                        : "border-slate-200 bg-slate-100 text-slate-400"
                    )}
                  >
                    {isDone ? (
                      <Check size={16} strokeWidth={3} />
                    ) : isActive ? (
                      <Loader2 size={16} className="animate-spin text-white" />
                    ) : (
                      <span className="font-mono text-xs">{idx + 1}</span>
                    )}
                  </div>

                  {/* Stage description & detail */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p
                        className={cx(
                          "text-[14px] font-bold",
                          isActive
                            ? "text-blue-900"
                            : isDone
                            ? "text-slate-900"
                            : "text-slate-500"
                        )}
                      >
                        {stage.label}
                      </p>
                      {isDone && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Verified
                        </span>
                      )}
                      {isActive && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
                          Processing
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-[12px] text-slate-500">
                      {isActive ? stage.doing : stage.techDetail}
                    </p>

                    {/* Output detail tag when done */}
                    {isDone && details[stage.id] && (
                      <motion.div
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-1 font-mono text-[11.5px] font-medium text-emerald-800"
                      >
                        <Check size={12} className="text-emerald-600" />
                        <span>{details[stage.id]}</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real-time Model Reasoning Terminal Log */}
          <div className="mt-6 rounded-2xl border border-slate-900 bg-slate-950 p-4 text-emerald-400 font-mono text-[11.5px] shadow-inner">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal size={13} className="text-blue-400" />
                <span className="text-[11px] font-semibold tracking-wide uppercase">
                  Gemma 4 Multimodal Reasoning Stream
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10.5px]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed
              </span>
            </div>
            <div className="space-y-1 overflow-hidden leading-relaxed">
              {terminalLogs.map((log, i) => (
                <div key={i} className="truncate text-slate-300">
                  <span className="text-emerald-500">›</span> {log}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message & Retry State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/90 p-5 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                    <TriangleAlert size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-bold text-rose-900">
                      Analysis Pipeline Interrupted
                    </h3>
                    <p className="mt-1 text-[12.5px] text-rose-700 leading-relaxed">
                      {error}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <button
                        onClick={() => void run()}
                        className={buttonClasses("primary", "sm")}
                      >
                        <RefreshCw size={13} />
                        <span>Retry Multimodal Pipeline</span>
                      </button>
                      <Link
                        href={`/app/verify/${verificationId}`}
                        className={buttonClasses("secondary", "sm")}
                      >
                        <span>Return to Verification</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
