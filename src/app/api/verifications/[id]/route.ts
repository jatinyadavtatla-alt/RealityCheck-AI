import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyses, verifications } from "@/db/schema";
import { jsonError, jsonOk, requireUser } from "@/server/http";
import { getVerificationBundle } from "@/server/queries";
import { memoryStore } from "@/server/store";

function serialize(v: {
  id: string;
  productName: string;
  productCategory: string;
  listingUrl: string | null;
  sellerDescription: string;
  additionalDetails: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: v.id,
    productName: v.productName,
    productCategory: v.productCategory,
    listingUrl: v.listingUrl,
    sellerDescription: v.sellerDescription,
    additionalDetails: v.additionalDetails,
    status: v.status,
    errorMessage: v.errorMessage,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const bundle = await getVerificationBundle(auth.user.id, id);
  if (!bundle) {
    return jsonError(404, "Verification not found.", "NOT_FOUND");
  }

  return jsonOk({
    verification: serialize(bundle.verification),
    analysis: bundle.analysis
      ? {
          modelUsed: bundle.analysis.modelUsed,
          productOverview: bundle.analysis.productOverview,
          extractedClaims: bundle.analysis.extractedClaims,
          visualObservations: bundle.analysis.visualObservations,
          comparisons: bundle.analysis.comparisons,
          discrepancies: bundle.analysis.discrepancies,
          unverifiableClaims: bundle.analysis.unverifiableClaims,
          followUpQuestions: bundle.analysis.followUpQuestions,
          overallAssessment: bundle.analysis.overallAssessment,
          durationMs: bundle.analysis.durationMs,
          createdAt: bundle.analysis.createdAt.toISOString(),
        }
      : null,
    images: bundle.images,
    messages: bundle.messages,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  try {
    const deleted = await db
      .delete(verifications)
      .where(and(eq(verifications.id, id), eq(verifications.userId, auth.user.id)))
      .returning({ id: verifications.id });

    if (deleted.length > 0) {
      return jsonOk({ ok: true });
    }
  } catch {
    // fallback to memoryStore
  }

  await memoryStore.deleteVerification(id);
  return jsonOk({ ok: true });
}
