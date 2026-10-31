"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, CircleHelp, ShieldCheck, TriangleAlert } from "lucide-react";
import { Logo } from "@/components/ui";

export function AuthShell({
  title,
  sub,
  children,
  footer,
}: {
  title: string;
  sub: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Brand panel */}
      <div className="relative hidden w-[44%] overflow-hidden bg-navy lg:flex lg:flex-col lg:justify-between">
        <div
          className="noise-grid absolute inset-0 opacity-25"
          aria-hidden="true"
        />
        <div className="relative p-10">
          <Link href="/">
            <Logo dark />
          </Link>
        </div>

        <div className="relative px-10 pb-6">
          <h2 className="max-w-sm text-[28px] font-semibold leading-tight tracking-tight text-white">
            Don&rsquo;t trust the listing. Verify the evidence.
          </h2>
          <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-white/60">
            RealityCheck compares seller claims with the actual product photos —
            and tells you exactly what can&rsquo;t be proven.
          </p>

          <div className="mt-8 space-y-2.5">
            {[
              {
                icon: BadgeCheck,
                cls: "text-success",
                text: "Claims supported by visible evidence",
              },
              {
                icon: TriangleAlert,
                cls: "text-[#ff8f8f]",
                text: "Potential discrepancies, flagged with proof",
              },
              {
                icon: CircleHelp,
                cls: "text-warning",
                text: "Unverifiable claims called out honestly",
              },
            ].map((row) => (
              <div key={row.text} className="flex items-center gap-2.5">
                <row.icon size={15} className={row.cls} />
                <span className="text-[13px] font-medium text-white/80">
                  {row.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative px-10 pb-10">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <ShieldCheck size={15} className="shrink-0 text-accent" />
            <p className="font-mono text-[11px] text-white/55">
              gemma-4-31b-it · Gemini API · your photos stay private to your
              account
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]"
        >
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{sub}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 border-t border-line pt-5 text-sm text-muted">
            {footer}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
