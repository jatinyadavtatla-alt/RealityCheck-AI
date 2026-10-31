"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  CircleHelp,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  SendHorizonal,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  User,
} from "lucide-react";
import { LogoMark, cx } from "@/components/ui";
import { ApiError, apiFetch } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

const NL = String.fromCharCode(10);

const SUGGESTIONS = [
  "Should I buy this listing given the evidence?",
  "What's the strongest visual evidence of a contradiction?",
  "Draft a polite message to the seller to negotiate a discount.",
  "What specific in-person test should I perform before paying?",
];

function AssistantContent({ text }: { text: string }) {
  const lines = text.split(NL).map((l) => l.trimEnd());
  const blocks: { type: "p" | "li"; text: string }[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      blocks.push({ type: "li", text: trimmed.slice(2) });
    } else {
      blocks.push({ type: "p", text: trimmed });
    }
  }
  return (
    <div className="space-y-2">
      {blocks.map((b, i) =>
        b.type === "li" ? (
          <p key={i} className="flex items-start gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
            <span>{b.text}</span>
          </p>
        ) : (
          <p key={i}>{b.text}</p>
        )
      )}
    </div>
  );
}

export function AssistantView({
  verificationId,
  productName,
  headline,
  counts,
  topDiscrepancies = [],
  initialMessages = [],
  discrepancyCount,
  supportedCount,
}: {
  verificationId: string;
  productName: string;
  headline?: string;
  counts?: { supported: number; discrepancy: number; unverifiable: number };
  topDiscrepancies?: string[];
  initialMessages?: ChatMessage[];
  discrepancyCount?: number;
  supportedCount?: number;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setInput("");
    setError(null);
    const optimistic: ChatMessage = {
      role: "user",
      content: message,
      at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setPending(true);
    try {
      const res = await apiFetch<{
        reply: string | ChatMessage;
        messages: ChatMessage[];
      }>(`/api/assistant/${verificationId}`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      if (res.messages && Array.isArray(res.messages)) {
        setMessages(res.messages);
      } else if (res.reply) {
        const replyText = typeof res.reply === "string" ? res.reply : res.reply.content;
        setMessages((m) => [
          ...m,
          { role: "assistant", content: replyText, at: new Date().toISOString() },
        ]);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not reach the assistant. Please try again."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col h-[650px] max-h-[80vh] rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-slate-900">
                Buyer Assistant Copilot
              </h2>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Online
              </span>
            </div>
            <p className="text-[12px] text-slate-500 truncate max-w-sm">
              Answering strictly from visual evidence & findings for {productName}
            </p>
          </div>
        </div>

        <Link
          href={`/app/verify/${verificationId}`}
          className="text-[12.5px] font-semibold text-blue-600 hover:text-blue-700"
        >
          View Full Dossier
        </Link>
      </div>

      {/* Messages stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white via-white to-slate-50/40"
      >
        {messages.length === 0 && (
          <div className="my-auto flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
              <Bot size={24} />
            </div>
            <h3 className="text-[16px] font-bold text-slate-900">
              How can I assist your purchasing decision?
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md">
              Ask about condition risks, price counteroffers, authenticity red flags, or specific defects found in the photos.
            </p>

            {/* Starter Suggestion Chips */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 active:scale-[0.98]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cx(
                "flex items-start gap-3",
                isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cx(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold shadow-2xs",
                  isUser
                    ? "bg-slate-900 text-white"
                    : "bg-blue-600 text-white"
                )}
              >
                {isUser ? <User size={15} /> : <Bot size={16} />}
              </div>

              <div
                className={cx(
                  "max-w-xl rounded-2xl px-4.5 py-3 text-[13.5px] leading-relaxed shadow-xs",
                  isUser
                    ? "bg-gradient-to-b from-blue-600 to-blue-700 text-white"
                    : "border border-slate-200/90 bg-white text-slate-800"
                )}
              >
                {isUser ? (
                  <p>{m.content}</p>
                ) : (
                  <AssistantContent text={m.content} />
                )}
              </div>
            </motion.div>
          );
        })}

        {pending && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Bot size={16} />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-[13px] text-slate-500 shadow-xs">
              <Loader2 size={15} className="animate-spin text-blue-600" />
              <span>Gemma 4 is inspecting evidence findings...</span>
            </div>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-rose-50 border-t border-rose-200 px-6 py-2.5 text-[12.5px] font-medium text-rose-700 flex items-center gap-2">
          <TriangleAlert size={15} className="text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="border-t border-slate-100 bg-white p-4"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={pending}
            placeholder="Ask about discrepancies, price negotiation, or photo evidence..."
            className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 py-3 pl-4 pr-12 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs transition hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none"
          >
            <SendHorizonal size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
