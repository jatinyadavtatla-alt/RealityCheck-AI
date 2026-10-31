"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  History,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  Sparkles,
  ShieldCheck,
  Search,
  Command,
  X,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Logo, LogoMark, cx } from "@/components/ui";

const NAV = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/new", label: "New Audit", icon: Plus, badge: "New" },
  { href: "/app/history", label: "Evidence History", icon: History },
  { href: "/app/settings", label: "Engine Settings", icon: Settings },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
      {NAV.map((item) => {
        const active =
          item.href === "/app/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cx(
              "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-all duration-200 select-none",
              active
                ? "text-blue-600 font-semibold"
                : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70"
            )}
          >
            {active && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-xl bg-blue-50/80 border border-blue-200/60 shadow-xs"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-3">
              <item.icon
                size={18}
                strokeWidth={active ? 2.3 : 1.9}
                className={cx(
                  "transition-colors duration-200",
                  active
                    ? "text-blue-600"
                    : "text-slate-400 group-hover:text-slate-700"
                )}
              />
              <span>{item.label}</span>
            </div>

            {item.badge && (
              <span className="relative z-10 rounded-full bg-blue-100/80 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function WorkspaceBadge({ user }: { user: { name: string; email: string } }) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-xs backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-[12px] font-bold text-white shadow-xs">
          {initials || "RC"}
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-slate-900">
              {user.name}
            </span>
            <span className="rounded bg-emerald-50 px-1 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-700">
              Pro
            </span>
          </div>
          <span className="block truncate text-[11.5px] text-slate-500">
            {user.email}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Desktop sleek light sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-slate-200/80 bg-white/70 p-4.5 backdrop-blur-2xl lg:flex">
        <div>
          {/* Logo Brand */}
          <div className="px-2 pb-7 pt-2">
            <Link
              href="/app/dashboard"
              aria-label="RealityCheck AI Dashboard"
              className="group inline-flex items-center gap-2.5"
            >
              <LogoMark size={32} />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[17px] font-bold tracking-tight text-slate-950">
                    RealityCheck
                  </span>
                  <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                    AI
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  Multimodal Evidence Engine
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Action Button */}
          <div className="mb-6 px-1">
            <Link
              href="/app/new"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(37,99,235,0.25)] transition hover:from-blue-500 hover:to-blue-600 active:scale-[0.98]"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Evidence Audit</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="px-1">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </p>
            <NavItems />
          </div>

          {/* Engine Status Card */}
          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Gemma 4 Multimodal
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Online
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-600">
              Sub-pixel visual defect mapping & claim contradiction parsing active.
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
              <span>Gemini 3.8 / Gemma API</span>
              <span className="font-mono font-medium text-slate-600">v2.4</span>
            </div>
          </div>
        </div>

        {/* User Workspace Profile */}
        <WorkspaceBadge user={user} />
      </aside>

      {/* Top Navbar for Large Screens & Mobile Header */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/70 px-4 backdrop-blur-xl sm:px-8 lg:pl-72">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Open navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={18} />
          </button>

          {/* Quick Search / Command trigger */}
          <div className="relative hidden w-80 sm:block">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              readOnly
              onClick={() => {
                const el = document.getElementById("search-input");
                if (el) el.focus();
              }}
              placeholder="Search audits, products or claims..."
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 py-2 pl-9 pr-14 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
            <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 shadow-2xs">
              <Command size={10} />
              <span>K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-[12px] font-medium text-slate-600 shadow-2xs sm:flex">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>Zero-Trust Evidence Engine</span>
          </div>

          <Link
            href="/app/new"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-xs transition hover:bg-blue-500 active:scale-[0.98]"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">New Audit</span>
          </Link>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
              onClick={() => setDrawer(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="absolute inset-y-0 left-0 flex w-72 flex-col justify-between border-r border-slate-200 bg-white p-5 shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between pb-6 pt-1">
                  <div className="flex items-center gap-2">
                    <LogoMark size={28} />
                    <span className="text-[16px] font-bold tracking-tight text-slate-900">
                      RealityCheck AI
                    </span>
                  </div>
                  <button
                    onClick={() => setDrawer(false)}
                    aria-label="Close menu"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                </div>
                <NavItems onNavigate={() => setDrawer(false)} />
              </div>
              <WorkspaceBadge user={user} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
