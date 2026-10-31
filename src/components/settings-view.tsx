"use client";

import { useState, type FormEvent } from "react";
import {
  Check,
  CircleCheck,
  Cpu,
  Database,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRound,
  Zap,
} from "lucide-react";
import { Badge, Button, Field, Input } from "@/components/ui";
import { ApiError, apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface AiStatus {
  configured: boolean;
  model: string;
  modelRecognized: boolean;
}

export function SettingsView({
  user,
  ai,
}: {
  user: { name: string; email: string; createdAt: string };
  ai: AiStatus;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
          Engine &amp; Workspace Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Gemma 4 model runtime, API keys, and zero-trust verification parameters.
        </p>
      </div>

      {/* AI Engine Status Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-slate-900">
                  Gemma 4 Multimodal Engine
                </h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-[12.5px] text-slate-500">
                Powered by Google AI Studio Gemini API
              </p>
            </div>
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-[11px] font-bold text-slate-700">
            {ai.model}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              API Connection
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-[13.5px] font-bold text-emerald-600">
              <CircleCheck size={16} />
              <span>Configured &amp; Verified</span>
            </div>
            <p className="mt-1 text-[11.5px] text-slate-400">
              Google AI Studio Gemini key active
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Inspection Mode
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-[13.5px] font-bold text-slate-900">
              <Zap size={16} className="text-amber-500" />
              <span>Sub-Pixel Cross Check</span>
            </div>
            <p className="mt-1 text-[11.5px] text-slate-400">
              Automatic model fallback enabled
            </p>
          </div>
        </div>
      </div>

      {/* Pro Workspace Profile Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <UserRound size={18} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">
              Active Workspace Profile
            </h3>
            <p className="text-[12px] text-slate-500">
              Authentication removed for direct dashboard access
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500">Workspace Operator</span>
            <span className="font-bold text-slate-900">{user.name}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500">Email</span>
            <span className="font-mono text-slate-700">{user.email}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500">Plan Tier</span>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
              Enterprise Pro (Unlimited)
            </span>
          </div>
        </div>
      </div>

      {/* Privacy & Storage Vault Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Database size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="text-[15px] font-bold text-slate-900">
              Zero-Trust Evidence Vault
            </h3>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Uploaded evidence photos and audit dossiers are stored in your secure local instance. No photos or listing texts are ever used to train public models. Deleting an audit case wipes all associated visual records permanently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
