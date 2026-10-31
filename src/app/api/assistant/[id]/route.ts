import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyses, conversations, verifications, type AnalysisRow, type VerificationRow } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody, requireUser } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { getAiConfigStatus } from "@/server/env";
import { assistantMessageSchema } from "@/server/validators";
import { runAssistantReply } from "@/server/gemini/pipeline";
import { AiError } from "@/server/gemini/client";
import type { ChatMessage } from "@/lib/types";
import { memoryStore } from "@/server/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  try {
    const rows = await db
      .select({ messages: conversations.messages })
      .from(conversations)
      .where(
        and(
          eq(conversations.verificationId, id),
          eq(conversations.userId, auth.user.id)
        )
      )
      .limit(1);

    if (rows[0]?.messages) {
      return jsonOk({ messages: rows[0].messages });
    }
  } catch {
    // fallback
  }

  const bundle = await memoryStore.getVerificationBundle(auth.user.id, id);
  return jsonOk({ messages: bundle?.messages ?? [] });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const { id } = await params;

  const rl = rateLimit(`assistant:${user.id}`, 60, 60 * 60 * 1000);
  if (!rl.ok) {
    return jsonError(
      429,
      "Assistant message limit reached. Please try again later.",
      "RATE_LIMITED"
    );
  }

  const parsed = await parseJsonBody(req, assistantMessageSchema);
  if ("response" in parsed) return parsed.response;
  const message = parsed.data.message;

  let verification: VerificationRow | null = null;
  let analysis: AnalysisRow | null = null;
  let history: ChatMessage[] = [];

  try {
    const vRows = await db
      .select()
      .from(verifications)
      .where(and(eq(verifications.id, id), eq(verifications.userId, user.id)))
      .limit(1);
    verification = vRows[0] ?? null;

    if (verification) {
      const aRows = await db
        .select()
        .from(analyses)
        .where(eq(analyses.verificationId, verification.id))
        .limit(1);
      analysis = aRows[0] ?? null;

      const convRows = await db
        .select()
        .from(conversations)
        .where(eq(conversations.verificationId, verification.id))
        .limit(1);
      history = convRows[0]?.messages ?? [];
    }
  } catch {
    // fallback
  }

  if (!verification || !analysis) {
    const bundle = await memoryStore.getVerificationBundle(user.id, id);
    if (!bundle) {
      return jsonError(404, "Verification not found.", "NOT_FOUND");
    }
    verification = bundle.verification;
    analysis = bundle.analysis;
    history = bundle.messages;
  }

  if (!analysis) {
    return jsonError(
      409,
      "Run the AI analysis before chatting with the buyer assistant.",
      "NO_ANALYSIS"
    );
  }

  const aiStatus = getAiConfigStatus();
  if (!aiStatus.configured) {
    return jsonError(
      503,
      "The assistant is unavailable because Gemma 4 is not configured on this server (GEMINI_API_KEY missing).",
      "AI_NOT_CONFIGURED",
      { model: aiStatus.model }
    );
  }

  try {
    const reply = await runAssistantReply({
      verification,
      analysis,
      history,
      message,
    });

    const userTurn: ChatMessage = {
      role: "user",
      content: message,
      at: new Date().toISOString(),
    };
    const assistantTurn: ChatMessage = {
      role: "assistant",
      content: reply,
      at: new Date().toISOString(),
    };
    const updatedMessages: ChatMessage[] = [...history, userTurn, assistantTurn];

    try {
      await db
        .insert(conversations)
        .values({
          verificationId: verification.id,
          userId: user.id,
          messages: updatedMessages,
        })
        .onConflictDoUpdate({
          target: conversations.verificationId,
          set: {
            messages: updatedMessages,
            updatedAt: new Date(),
          },
        });
    } catch {
      await memoryStore.appendChatMessage(verification.id, userTurn);
      await memoryStore.appendChatMessage(verification.id, assistantTurn);
    }

    return jsonOk({ reply, messages: updatedMessages });
  } catch (err) {
    const aiError =
      err instanceof AiError
        ? err
        : new AiError("UPSTREAM", "Failed to get an answer from the assistant.");
    return jsonError(500, aiError.message, aiError.code);
  }
}
