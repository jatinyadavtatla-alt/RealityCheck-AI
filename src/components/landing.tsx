"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CircleHelp,
  FileSearch,
  GitCompareArrows,
  ImagePlus,
  Layers,
  Link2,
  MessagesSquare,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TextQuote,
  TriangleAlert,
} from "lucide-react";
import { Logo, buttonClasses, cx } from "@/components/ui";

const IMG_LISTING =
  "https://images.pexels.com/photos/6373189/pexels-photo-6373189.jpeg?auto=compress&cs=tinysrgb&w=900";
const IMG_CRACK_CLOSE =
  "https://images.pexels.com/photos/16658257/pexels-photo-16658257.jpeg?auto=compress&cs=tinysrgb&w=900";
const IMG_CRACK_WIDE =
  "https://images.pexels.com/photos/16658255/pexels-photo-16658255.jpeg?auto=compress&cs=tinysrgb&w=1200";
const IMG_CRACK_REPAIR =
  "https://images.pexels.com/photos/31884550/pexels-photo-31884550.jpeg?auto=compress&cs=tinysrgb&w=900";

const ease = [0.22, 1, 0.36, 1] as const;

function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease }}
      className={cx(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left"
      )}
    >
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-[34px] sm:leading-[1.15]">
        {title}
      </h2>
      {sub && (
        <p className="mt-3.5 text-pretty text-[15px] leading-relaxed text-muted">
          {sub}
        </p>
      )}
    </motion.div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      {/* Listing photo card, behind */}
      <motion.div
        initial={{ opacity: 0, y: 24, rotate: -6 }}
        animate={{ opacity: 1, y: 0, rotate: -6 }}
        transition={{ duration: 0.8, ease, delay: 0.35 }}
        className="absolute -left-6 top-16 hidden w-44 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-raised)] sm:block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMG_LISTING}
          alt="Listing photo of a phone that looks pristine"
          className="h-36 w-full object-cover"
          loading="eager"
        />
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">
            Listing photo
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-ink-2">
            Studio-lit stock angle
          </p>
        </div>
      </motion.div>

      {/* Main report card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease, delay: 0.15 }}
        className="relative z-10 rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-modal)]"
      >
        <div className="flex items-center justify-between border-b border-line pb-3.5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Verification report
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              iPhone 14 · Marketplace listing
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-1 text-[11px] font-semibold text-danger-strong">
            <TriangleAlert size={12} strokeWidth={2.5} />2 discrepancies
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-canvas p-3.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-faint">
              <TextQuote size={12} /> Seller claims
            </p>
            <p className="mt-2 text-[13px] font-medium leading-snug text-ink">
              “No scratches on the display. Excellent condition, everything works
              perfectly.”
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-soft px-1.5 py-0.5 text-[10px] font-medium text-ink-2">
                condition
              </span>
              <span className="rounded-md bg-soft px-1.5 py-0.5 text-[10px] font-medium text-ink-2">
                c1
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMG_CRACK_CLOSE}
              alt="Actual phone with visible screen damage"
              className="h-full max-h-44 w-full object-cover"
              loading="eager"
            />
            <div
              className="absolute inset-x-0 h-10 bg-accent/25 mix-blend-multiply blur-sm animate-scan"
              aria-hidden="true"
            />
            <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-ink/85 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-danger" />
              Scratch cluster · upper display
            </div>
            <div className="absolute bottom-2 right-2 rounded-md bg-surface/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-ink-2 backdrop-blur">
              P2
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-danger-soft px-3.5 py-3">
          <div className="flex items-center gap-2">
            <TriangleAlert size={15} className="text-danger-strong" />
            <span className="text-[12.5px] font-semibold text-danger-strong">
              Potential discrepancy — visible scratches contradict claim c1
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted">Confidence</span>
            <div className="h-[6px] w-20 overflow-hidden rounded-full bg-soft">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.9, duration: 0.7, ease }}
                className="h-full rounded-full bg-success"
              />
            </div>
            <span className="text-[11px] font-semibold text-success-strong">
              High
            </span>
          </div>
          <span className="font-mono text-[10px] text-faint">
            gemma-4 · evidence o2, o4
          </span>
        </div>
      </motion.div>

      {/* Floating chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6, ease }}
        className="absolute -right-3 top-6 z-20 animate-float rounded-xl border border-line bg-surface px-3 py-2 shadow-[var(--shadow-raised)] sm:-right-8"
      >
        <div className="flex items-center gap-1.5">
          <CircleHelp size={13} className="text-warning-ink" />
          <span className="text-[11px] font-semibold text-ink-2">
            “Battery health 95%”
          </span>
        </div>
        <p className="mt-0.5 text-[10px] font-medium text-warning-ink">
          Cannot be verified from photos
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.6, ease }}
        className="absolute -bottom-5 right-6 z-20 animate-float rounded-xl border border-line bg-surface px-3 py-2 shadow-[var(--shadow-raised)] [animation-delay:1.2s]"
      >
        <div className="flex items-center gap-1.5">
          <BadgeCheck size={13} className="text-success" />
          <span className="text-[11px] font-semibold text-ink-2">
            “Original box included”
          </span>
        </div>
        <p className="mt-0.5 text-[10px] font-medium text-success-strong">
          Supported by photo P4
        </p>
      </motion.div>
    </div>
  );
}

export function Landing({ authed }: { authed: boolean }) {
  const ctaHref = authed ? "/app/dashboard" : "/register";

  return (
    <div className="min-h-screen bg-canvas">
      {/* ------------------------------ Nav ------------------------------ */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line/60 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="RealityCheck AI home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-[13.5px] font-medium text-muted md:flex">
            <a href="#how" className="transition hover:text-ink">
              How it works
            </a>
            <a href="#example" className="transition hover:text-ink">
              Evidence example
            </a>
            <a href="#engine" className="transition hover:text-ink">
              The AI engine
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            {authed ? (
              <Link href="/app/dashboard" className={buttonClasses("primary", "sm")}>
                Open dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={buttonClasses("ghost", "sm", "hidden sm:inline-flex")}
                >
                  Sign in
                </Link>
                <Link href="/register" className={buttonClasses("primary", "sm")}>
                  Verify a Product
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ----------------------------- Hero ------------------------------ */}
      <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40">
        <div
          className="noise-grid pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            maskImage:
              "radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 75%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 shadow-[var(--shadow-card)]"
            >
              <Sparkles size={13} className="text-accent" />
              <span className="text-xs font-medium text-ink-2">
                Multimodal evidence analysis · powered by{" "}
                <span className="font-mono text-[11px] font-semibold text-accent-ink">
                  gemma-4
                </span>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.08 }}
              className="mt-6 text-balance text-[42px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[56px]"
            >
              See beyond the{" "}
              <span className="relative whitespace-nowrap text-accent">
                seller&rsquo;s claims
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="8"
                  viewBox="0 0 220 8"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 6C60 1.5 160 1.5 218 5.5"
                    stroke="#356DF3"
                    strokeOpacity="0.35"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              .
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.16 }}
              className="mt-5 max-w-lg text-pretty text-[16.5px] leading-relaxed text-muted"
            >
              Compare what sellers promise with what product evidence reveals.
              RealityCheck AI reads the listing, inspects the actual photos, and
              shows you every claim the pixels can&rsquo;t back up.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-4 font-mono text-[12px] font-medium uppercase tracking-[0.16em] text-faint"
            >
              Don&rsquo;t trust the listing. Verify the evidence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.28 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link href={ctaHref} className={buttonClasses("primary", "lg")}>
                Verify a Product <ArrowRight size={16} />
              </Link>
              <a href="#how" className={buttonClasses("secondary", "lg")}>
                Explore How It Works
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] font-medium text-muted"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-success" /> Evidence-linked
                findings
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ScanSearch size={14} className="text-accent" /> Claim × photo
                comparison
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessagesSquare size={14} className="text-warning-ink" /> Buyer
                question engine
              </span>
            </motion.div>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* --------------------------- How it works ------------------------ */}
      <section id="how" className="border-t border-line/70 bg-surface py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="Workflow"
            title="From listing to verdict in four steps"
            sub="A deliberate pipeline — claims, pixels, comparison, report. Every finding links back to the photo that caused it."
          />
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Link2,
                step: "01",
                title: "Describe the listing",
                body: "Paste the listing URL or drop in screenshots, then add the seller's description of the item.",
              },
              {
                icon: ImagePlus,
                step: "02",
                title: "Upload real evidence",
                body: "Add photos of the actual product — the ones the seller sends you, not the marketing shots.",
              },
              {
                icon: GitCompareArrows,
                step: "03",
                title: "Gemma 4 compares",
                body: "Claims are extracted, photos are inspected for visible damage, and each claim is weighed against the evidence.",
              },
              {
                icon: FileSearch,
                step: "04",
                title: "Read the report",
                body: "Supported, potential discrepancy, or cannot be verified — with confidence, limitations and questions to ask.",
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, ease, delay: i * 0.09 }}
                className="group relative rounded-2xl border border-line bg-canvas p-6 transition-shadow hover:shadow-[var(--shadow-raised)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                    <s.icon size={18} strokeWidth={2.2} />
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-faint">
                    {s.step}
                  </span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-ink">
                  {s.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                  {s.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- Example ----------------------------- */}
      <section id="example" className="py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="A real pattern"
            title="The listing said “no scratches.” The photos disagreed."
            sub="This is what a RealityCheck comparison looks like — claim on the left, evidence on the right, verdict in the middle."
          />

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease }}
            className="mt-14 overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow-raised)]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Claims side */}
              <div className="border-b border-line p-8 lg:border-b-0 lg:border-r">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-faint">
                  Seller&rsquo;s claims
                </p>
                <blockquote className="mt-4 border-l-[3px] border-line pl-4 text-lg font-medium leading-snug text-ink">
                  “iPhone 14, excellent condition, no scratches, everything works
                  perfectly. Battery at 95%.”
                </blockquote>
                <ul className="mt-6 space-y-3">
                  {[
                    { text: "No scratches on the display", state: "fail" },
                    { text: "Excellent overall condition", state: "fail" },
                    { text: "Everything works perfectly", state: "unknown" },
                    { text: "Battery health 95%", state: "unknown" },
                  ].map((c) => (
                    <li key={c.text} className="flex items-center gap-2.5 text-sm">
                      {c.state === "fail" ? (
                        <TriangleAlert
                          size={15}
                          className="shrink-0 text-danger"
                        />
                      ) : (
                        <CircleHelp
                          size={15}
                          className="shrink-0 text-warning-ink"
                        />
                      )}
                      <span className="font-medium text-ink-2">{c.text}</span>
                      <span
                        className={cx(
                          "ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                          c.state === "fail"
                            ? "bg-danger-soft text-danger-strong"
                            : "bg-warning-soft text-warning-ink"
                        )}
                      >
                        {c.state === "fail" ? "Contradicted" : "No photo proof"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Evidence side */}
              <div className="bg-canvas p-8">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-faint">
                  What the evidence shows
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="relative overflow-hidden rounded-xl border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={IMG_CRACK_WIDE}
                      alt="Cracked phone on asphalt"
                      className="h-32 w-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <span className="absolute bottom-2 left-2 rounded-md bg-ink/85 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white">
                      P1 · cracked glass
                    </span>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={IMG_CRACK_REPAIR}
                      alt="Damaged phone screen close-up"
                      className="h-32 w-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <span className="absolute bottom-2 left-2 rounded-md bg-ink/85 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white">
                      P3 · corner damage
                    </span>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5 rounded-xl border border-danger/20 bg-danger-soft/60 p-4">
                  <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-2">
                    <TriangleAlert
                      size={14}
                      className="mt-0.5 shrink-0 text-danger"
                    />
                    <span>
                      <strong className="font-semibold">o1, o3:</strong> A crack
                      runs across the upper-left of the display; impact chips are
                      visible on two corners. Surface marks appear along the right
                      bezel.
                    </span>
                  </p>
                  <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-2">
                    <CircleHelp
                      size={14}
                      className="mt-0.5 shrink-0 text-warning-ink"
                    />
                    <span>
                      Functionality and battery claims can&rsquo;t be settled by
                      photographs — request a battery-health screenshot and a
                      short working video.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --------------------------- AI engine --------------------------- */}
      <section id="engine" className="border-y border-line/70 bg-surface py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="The engine"
            title="Four specialist stages, one honest report"
            sub="No single opaque score. A staged multimodal pipeline shows its work — and knows the limits of photography."
          />
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: TextQuote,
                name: "claim-extractor",
                desc: "Pulls every checkable statement out of the seller's description and listing screenshots.",
              },
              {
                icon: ScanSearch,
                name: "vision-inspector",
                desc: "Examines each product photo for scratches, dents, cracks, screen damage, wear and missing parts.",
              },
              {
                icon: GitCompareArrows,
                name: "evidence-comparator",
                desc: "Weighs every claim against what's visible: supported, potential discrepancy, or unverifiable.",
              },
              {
                icon: Layers,
                name: "report-builder",
                desc: "Composes the final assessment with confidence levels, limitations and questions for the seller.",
              },
            ].map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, ease, delay: i * 0.09 }}
                className="rounded-2xl border border-line bg-canvas p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
                  <s.icon size={18} strokeWidth={2} />
                </div>
                <p className="mt-4 font-mono text-[12.5px] font-semibold text-ink">
                  {s.name}
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-center font-mono text-[12px] text-faint"
          >
            running on <span className="font-semibold text-ink-2">gemma-4-31b-it</span>{" "}
            via the Gemini API · configurable through GEMMA_MODEL
          </motion.p>
        </div>
      </section>

      {/* --------------------------- Honesty ----------------------------- */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease }}
            >
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
                Radical honesty
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-[34px]">
                What RealityCheck will never tell you
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                Overconfident AI is how buyers get burned. Every finding is
                labeled as a verified observation, a potential discrepancy, or an
                unverifiable claim — never a invented certainty.
              </p>
            </motion.div>
            <div className="space-y-3.5">
              {[
                {
                  title: "“This product is genuine.”",
                  body: "Photographs can't prove authenticity. Serial numbers, receipts and manufacturer checks can.",
                },
                {
                  title: "“Nothing is wrong internally.”",
                  body: "No photo reveals battery cycles, liquid damage history or board-level repairs. We'll say it's unverifiable instead.",
                },
                {
                  title: "“No damage means mint condition.”",
                  body: "If a side isn't photographed, it isn't cleared. Missing evidence is shown as a gap, not a pass.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, ease, delay: i * 0.1 }}
                  className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]"
                >
                  <p className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger-soft">
                      <TriangleAlert size={11} className="text-danger" />
                    </span>
                    {item.title}
                  </p>
                  <p className="mt-2 pl-7 text-[13.5px] leading-relaxed text-muted">
                    {item.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- CTA ------------------------------- */}
      <section className="pb-24">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease }}
            className="relative overflow-hidden rounded-3xl bg-navy px-8 py-16 text-center sm:px-16"
          >
            <div
              className="noise-grid absolute inset-0 opacity-20"
              aria-hidden="true"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Don&rsquo;t trust the listing. Verify the evidence.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
                Your next second-hand purchase deserves more than a seller&rsquo;s
                word. Run it through RealityCheck first.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link
                  href={ctaHref}
                  className={buttonClasses(
                    "primary",
                    "lg",
                    "shadow-[0_8px_24px_-8px_rgb(53_109_243/0.7)]"
                  )}
                >
                  Verify a Product <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------------------- Footer ----------------------------- */}
      <footer className="border-t border-line/70 bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row">
          <Logo />
          <p className="text-center text-[12.5px] text-muted">
            Evidence over promises — for every second-hand purchase.
          </p>
          <p className="font-mono text-[11px] text-faint">
            RealityCheck AI · Gemma 4 on the Gemini API
          </p>
        </div>
      </footer>
    </div>
  );
}
