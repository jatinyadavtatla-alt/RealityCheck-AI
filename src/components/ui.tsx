"use client";

import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Check,
  CircleHelp,
  Copy,
  Loader2,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  CLAIM_STATUS_META,
  CONFIDENCE_META,
  type ClaimStatus,
  type Confidence,
  type VerificationStatus,
} from "@/lib/types";
import { buttonClasses, cx } from "./styles";

export { cx, buttonClasses };
export type { ButtonVariant, ButtonSize } from "./styles";

/* ------------------------------ Logo ------------------------------ */

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" fill="#356DF3" />
      <circle cx="14" cy="14" r="6" stroke="#fff" strokeWidth="2.4" />
      <path
        d="M18.6 18.6 24 24"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M11.3 14.1l1.9 1.9 3.6-4"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span
        className={cx(
          "text-[17px] font-semibold tracking-tight",
          dark ? "text-white" : "text-ink"
        )}
      >
        RealityCheck
        <span
          className={cx(
            "ml-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-wide",
            dark ? "bg-white/10 text-white" : "bg-accent-soft text-accent-ink"
          )}
        >
          AI
        </span>
      </span>
    </span>
  );
}

/* ----------------------------- Button ----------------------------- */

import type { ButtonVariant, ButtonSize } from "./styles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ------------------------------ Badge ----------------------------- */

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-soft text-ink-2",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success-strong",
  warning: "bg-warning-soft text-warning-ink",
  danger: "bg-danger-soft text-danger-strong",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({
  status,
  className,
}: {
  status: ClaimStatus;
  className?: string;
}) {
  const meta = CLAIM_STATUS_META[status];
  const Icon =
    status === "supported"
      ? BadgeCheck
      : status === "discrepancy"
        ? TriangleAlert
        : CircleHelp;
  return (
    <Badge tone={meta.tone} className={className}>
      <Icon size={13} strokeWidth={2.4} />
      {meta.label}
    </Badge>
  );
}

export function VerificationStatusChip({
  status,
}: {
  status: VerificationStatus;
}) {
  const map: Record<
    VerificationStatus,
    { label: string; tone: BadgeTone; pulse?: boolean }
  > = {
    draft: { label: "Draft — not analyzed", tone: "neutral" },
    analyzing: { label: "Analyzing…", tone: "accent", pulse: true },
    completed: { label: "Report ready", tone: "success" },
    failed: { label: "Analysis failed", tone: "danger" },
  };
  const m = map[status] ?? map.draft;
  return (
    <Badge tone={m.tone}>
      {m.pulse && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      )}
      {m.label}
    </Badge>
  );
}

export function ConfidenceMeter({ confidence }: { confidence: Confidence }) {
  const meta = CONFIDENCE_META[confidence];
  const color =
    confidence === "high"
      ? "bg-success"
      : confidence === "medium"
        ? "bg-warning"
        : "bg-faint";
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-[6px] w-16 overflow-hidden rounded-full bg-soft">
        <div
          className={cx("rounded-full transition-all", color)}
          style={{ width: `${meta.pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted">{meta.label}</span>
    </div>
  );
}

/* ------------------------------ Forms ----------------------------- */

interface FieldProps {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  optional?: boolean;
}

export function Field({ label, hint, error, optional, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-ink-2">{label}</span>
        {optional && <span className="text-xs text-faint">Optional</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-danger">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

const inputBase =
  "w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-faint transition-shadow focus-ring";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputBase, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(inputBase, "min-h-[110px] resize-y", props.className)}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputBase, props.className)} />;
}

/* ---------------------------- Feedback ---------------------------- */

export function Spinner({ size = 18 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-accent" />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-lg bg-soft", className)} />;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-8 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------ Modal ----------------------------- */

export function Modal({
  open,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-navy/55 backdrop-blur-[3px]"
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cx(
              "relative z-10 max-h-full overflow-auto rounded-2xl bg-surface shadow-[var(--shadow-modal)]",
              wide ? "w-full max-w-5xl" : "w-full max-w-md"
            )}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-muted transition hover:bg-ink/10 hover:text-ink"
            >
              <X size={16} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------- CopyButton -------------------------- */

export function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={buttonClasses("secondary", "sm")}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
      {copied ? "Copied" : label}
    </button>
  );
}
