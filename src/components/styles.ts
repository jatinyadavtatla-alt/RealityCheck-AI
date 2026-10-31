// Neutral styling helpers — safe to import from BOTH server and client
// components (no "use client" directive here on purpose).

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle" | "glow";
export type ButtonSize = "sm" | "md" | "lg";

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string
): string {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 select-none focus-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-[13px] font-medium tracking-tight",
    md: "h-10 px-4 text-[13.5px] font-medium tracking-tight",
    lg: "h-12 px-6 text-[15px] font-medium tracking-tight",
  };
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-gradient-to-b from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(37,99,235,0.25)] border border-blue-500/30",
    secondary:
      "bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] shadow-sm",
    ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70",
    danger:
      "bg-gradient-to-b from-rose-500 to-rose-600 text-white hover:from-rose-400 hover:to-rose-500 active:scale-[0.98] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(244,63,94,0.25)]",
    subtle: "bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-100",
    glow: "bg-slate-900 text-white hover:bg-slate-800 shadow-[0_4px_20px_rgba(15,23,42,0.15)] active:scale-[0.98]",
  };
  return cx(base, sizes[size], variants[variant], extra);
}
