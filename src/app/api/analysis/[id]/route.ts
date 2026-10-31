import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyses, images, verifications, type ImageRow, type VerificationRow } from "@/db/schema";
import { jsonError, jsonOk, requireUser } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { getAiConfigStatus } from "@/server/env";
import { assignImageRefs } from "@/server/images";
import {
  runAnalysisPipeline,
  type TaggedImage,
} from "@/server/gemini/pipeline";
import { AiError } from "@/server/gemini/client";
import type { AnalysisEvent } from "@/lib/types";
import { memoryStore } from "@/server/store";

const NL = String.fromCharCode(10);

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const { id } = await params;

  const rl = rateLimit(`analysis:${user.id}`, 60, 60 * 60 * 1000);
  if (!rl.ok) {
    return jsonError(
      429,
      "Hourly analysis limit reached. Please try again later.",
      "RATE_LIMITED",
      { retryAfterSec: rl.retryAfterSec }
    );
  }

  let verification: VerificationRow | null = null;
  let imageRows: ImageRow[] = [];

  try {
    const rows = await db
      .select()
      .from(verifications)
      .where(and(eq(verifications.id, id), eq(verifications.userId, user.id)))
      .limit(1);
    verification = rows[0] ?? null;

    if (verification) {
      imageRows = await db
        .select()
        .from(images)
        .where(eq(images.verificationId, verification.id))
        .orderBy(asc(images.createdAt), asc(images.id));
    }
  } catch {
    // fallback to memoryStore below
  }

  if (!verification) {
    const memBundle = await memoryStore.getVerificationBundle(user.id, id);
    if (!memBundle) {
      return jsonError(404, "Verification not found.", "NOT_FOUND");
    }
    verification = memBundle.verification;
    imageRows = await memoryStore.getImagesForVerification(id);
  }

  const productImgs = imageRows.filter((r) => r.kind === "product");
  if (productImgs.length === 0) {
    return jsonError(
      400,
      "Upload at least one photograph of the actual product before running the analysis.",
      "NO_PRODUCT_IMAGES"
    );
  }
  if (verification.sellerDescription.trim().length < 10) {
    return jsonError(
      400,
      "The seller description is too short for analysis.",
      "NO_DESCRIPTION"
    );
  }

  const aiStatus = getAiConfigStatus();
  if (!aiStatus.configured) {
    return jsonError(
      503,
      "Gemma 4 is not configured on this server. Set the GEMINI_API_KEY environment variable (and optionally GEMMA_MODEL) and restart the server.",
      "AI_NOT_CONFIGURED",
      { model: aiStatus.model }
    );
  }

  const refs = assignImageRefs(imageRows);
  const tagged: TaggedImage[] = imageRows.map((r) => ({
    id: r.id,
    ref: refs.get(r.id) ?? r.id,
    kind: r.kind === "listing" ? "listing" : "product",
    fileName: r.fileName,
    mimeType: r.mimeType,
    data: r.data,
  }));

  try {
    await db
      .update(verifications)
      .set({ status: "analyzing", errorMessage: null, updatedAt: new Date() })
      .where(eq(verifications.id, verification.id));
  } catch {
    await memoryStore.updateVerificationStatus(verification.id, "analyzing");
  }

  const encoder = new TextEncoder();
  const modelUsed = aiStatus.model;
  const targetVerification = verification;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: AnalysisEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + NL));
        } catch {
          closed = true;
        }
      };

      try {
        const { result, durationMs } = await runAnalysisPipeline({
          verification: targetVerification,
          listingImages: tagged.filter((i) => i.kind === "listing"),
          productImages: tagged.filter((i) => i.kind === "product"),
          emit: send,
        });

        try {
          await db
            .insert(analyses)
            .values({
              verificationId: targetVerification.id,
              modelUsed,
              productOverview: result.productOverview,
              extractedClaims: result.extractedClaims,
              visualObservations: result.visualObservations,
              comparisons: result.comparisons,
              discrepancies: result.discrepancies,
              unverifiableClaims: result.unverifiableClaims,
              followUpQuestions: result.followUpQuestions,
              overallAssessment: result.overallAssessment,
              durationMs,
            })
            .onConflictDoUpdate({
              target: analyses.verificationId,
              set: {
                modelUsed,
                productOverview: result.productOverview,
                extractedClaims: result.extractedClaims,
                visualObservations: result.visualObservations,
                comparisons: result.comparisons,
                discrepancies: result.discrepancies,
                unverifiableClaims: result.unverifiableClaims,
                followUpQuestions: result.followUpQuestions,
                overallAssessment: result.overallAssessment,
                durationMs,
                createdAt: new Date(),
              },
            });

          await db
            .update(verifications)
            .set({ status: "completed", errorMessage: null, updatedAt: new Date() })
            .where(eq(verifications.id, targetVerification.id));
        } catch {
          // Persist to memoryStore
          await memoryStore.saveAnalysis({
            id: `a_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
            verificationId: targetVerification.id,
            modelUsed,
            productOverview: result.productOverview,
            extractedClaims: result.extractedClaims,
            visualObservations: result.visualObservations,
            comparisons: result.comparisons,
            discrepancies: result.discrepancies,
            unverifiableClaims: result.unverifiableClaims,
            followUpQuestions: result.followUpQuestions,
            overallAssessment: result.overallAssessment,
            durationMs,
            createdAt: new Date(),
          });
          await memoryStore.updateVerificationStatus(targetVerification.id, "completed", null);
        }

        send({ type: "complete", verificationId: targetVerification.id, durationMs });
      } catch (err) {
        const aiError =
          err instanceof AiError
            ? err
            : new AiError("UPSTREAM", "Analysis failed unexpectedly. Please try again.");
        if (!(err instanceof AiError)) {
          console.error("[analysis] unexpected error:", err);
        }
        try {
          await db
            .update(verifications)
            .set({
              status: "failed",
              errorMessage: aiError.message,
              updatedAt: new Date(),
            })
            .where(eq(verifications.id, targetVerification.id));
        } catch {
          await memoryStore.updateVerificationStatus(targetVerification.id, "failed", aiError.message);
        }
        send({ type: "error", message: aiError.message, code: aiError.code });
      } finally {
        if (!closed) {
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  try {
    const rows = await db
      .select({
        analysis: analyses,
        ownerId: verifications.userId,
      })
      .from(analyses)
      .innerJoin(verifications, eq(analyses.verificationId, verifications.id))
      .where(eq(analyses.verificationId, id))
      .limit(1);

    const row = rows[0];
    if (row && row.ownerId === auth.user.id) {
      const a = row.analysis;
      return jsonOk({
        analysis: {
          modelUsed: a.modelUsed,
          productOverview: a.productOverview,
          extractedClaims: a.extractedClaims,
          visualObservations: a.visualObservations,
          comparisons: a.comparisons,
          discrepancies: a.discrepancies,
          unverifiableClaims: a.unverifiableClaims,
          followUpQuestions: a.followUpQuestions,
          overallAssessment: a.overallAssessment,
          durationMs: a.durationMs,
          createdAt: a.createdAt.toISOString(),
        },
      });
    }
  } catch {
    // fallback to memoryStore
  }

  const bundle = await memoryStore.getVerificationBundle(auth.user.id, id);
  if (!bundle || !bundle.analysis) {
    return jsonError(404, "Analysis not found.", "NOT_FOUND");
  }
  const a = bundle.analysis;
  return jsonOk({
    analysis: {
      modelUsed: a.modelUsed,
      productOverview: a.productOverview,
      extractedClaims: a.extractedClaims,
      visualObservations: a.visualObservations,
      comparisons: a.comparisons,
      discrepancies: a.discrepancies,
      unverifiableClaims: a.unverifiableClaims,
      followUpQuestions: a.followUpQuestions,
      overallAssessment: a.overallAssessment,
      durationMs: a.durationMs,
      createdAt: a.createdAt.toISOString(),
    },
  });
}
