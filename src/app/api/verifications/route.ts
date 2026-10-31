import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { images, verifications, type VerificationRow } from "@/db/schema";
import {
  jsonError,
  jsonOk,
  parseJsonBody,
  requireUser,
  sanitizeText,
} from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { createVerificationSchema } from "@/server/validators";
import { listVerifications } from "@/server/queries";
import { memoryStore } from "@/server/store";

export async function GET(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const result = await listVerifications(auth.user.id, { q, page });
  return jsonOk(result);
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const rl = rateLimit(`verify-create:${user.id}`, 60, 60 * 60 * 1000);
  if (!rl.ok) {
    return jsonError(429, "Too many verifications created. Please wait a while.", "RATE_LIMITED");
  }

  const parsed = await parseJsonBody(req, createVerificationSchema);
  if ("response" in parsed) return parsed.response;
  const data = parsed.data;

  const allImageIds = [...data.productImageIds, ...data.listingImageIds];
  const uniqueIds = [...new Set(allImageIds)];

  let created: VerificationRow | null = null;

  try {
    created = await db.transaction(async (tx) => {
      const owned = await tx
        .select({ id: images.id })
        .from(images)
        .where(
          and(
            eq(images.userId, user.id),
            isNull(images.verificationId),
            inArray(images.id, uniqueIds)
          )
        );

      if (owned.length !== uniqueIds.length) {
        return null;
      }

      const inserted = await tx
        .insert(verifications)
        .values({
          userId: user.id,
          productName: sanitizeText(data.productName),
          productCategory: data.productCategory,
          listingUrl: data.listingUrl ? data.listingUrl : null,
          sellerDescription: sanitizeText(data.sellerDescription),
          additionalDetails: data.additionalDetails
            ? sanitizeText(data.additionalDetails)
            : null,
          status: "draft",
        })
        .returning();

      const verification = inserted[0];

      if (data.productImageIds.length > 0) {
        await tx
          .update(images)
          .set({ verificationId: verification.id, kind: "product" })
          .where(
            and(eq(images.userId, user.id), inArray(images.id, data.productImageIds))
          );
      }
      if (data.listingImageIds.length > 0) {
        await tx
          .update(images)
          .set({ verificationId: verification.id, kind: "listing" })
          .where(
            and(eq(images.userId, user.id), inArray(images.id, data.listingImageIds))
          );
      }

      return verification;
    });
  } catch {
    // Fallback: save into memoryStore
    const newId = `v_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const newVer: VerificationRow = {
      id: newId,
      userId: user.id,
      productName: sanitizeText(data.productName),
      productCategory: data.productCategory,
      listingUrl: data.listingUrl ? data.listingUrl : null,
      sellerDescription: sanitizeText(data.sellerDescription),
      additionalDetails: data.additionalDetails
        ? sanitizeText(data.additionalDetails)
        : null,
      status: "draft",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await memoryStore.saveVerification(newVer);
    await memoryStore.assignImages(newId, data.productImageIds, data.listingImageIds);
    created = newVer;
  }

  if (!created) {
    return jsonError(
      400,
      "One or more images are invalid, missing, or already attached to another verification. Re-upload them and try again.",
      "BAD_IMAGES"
    );
  }

  return jsonOk({ verification: created }, { status: 201 });
}
