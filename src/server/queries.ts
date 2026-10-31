import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import {
  analyses,
  conversations,
  images,
  verifications,
  type AnalysisRow,
  type VerificationRow,
} from "@/db/schema";
import { assignImageRefs, toImageMeta } from "@/server/images";
import type { ChatMessage, ImageMeta, VerificationSummary } from "@/lib/types";
import { memoryStore } from "@/server/store";

/* ------------------------------------------------------------------ */

export interface VerificationBundle {
  verification: VerificationRow;
  analysis: AnalysisRow | null;
  images: ImageMeta[];
  messages: ChatMessage[];
}

export async function getVerificationBundle(
  userId: string,
  verificationId: string
): Promise<VerificationBundle | null> {
  try {
    const rows = await db
      .select()
      .from(verifications)
      .where(
        and(eq(verifications.id, verificationId), eq(verifications.userId, userId))
      )
      .limit(1);
    const verification = rows[0];
    if (!verification) {
      // Also check memory store in case it was created there or seeded
      return memoryStore.getVerificationBundle(userId, verificationId);
    }

    const imageRows = await db
      .select({
        id: images.id,
        kind: images.kind,
        fileName: images.fileName,
        mimeType: images.mimeType,
        sizeBytes: images.sizeBytes,
        createdAt: images.createdAt,
      })
      .from(images)
      .where(eq(images.verificationId, verificationId))
      .orderBy(asc(images.createdAt));

    const refs = assignImageRefs(imageRows);
    const imageMetas = imageRows.map((r) => toImageMeta(r, refs.get(r.id)));

    const analysisRows = await db
      .select()
      .from(analyses)
      .where(eq(analyses.verificationId, verificationId))
      .limit(1);

    const convRows = await db
      .select({ messages: conversations.messages })
      .from(conversations)
      .where(eq(conversations.verificationId, verificationId))
      .limit(1);

    return {
      verification,
      analysis: analysisRows[0] ?? null,
      images: imageMetas,
      messages: convRows[0]?.messages ?? [],
    };
  } catch (err) {
    console.warn("[db] Postgres fallback for getVerificationBundle:", err instanceof Error ? err.message : err);
    return memoryStore.getVerificationBundle(userId, verificationId);
  }
}

/* ------------------------------------------------------------------ */

export interface VerificationListResult {
  items: VerificationSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listVerifications(
  userId: string,
  options: { q?: string; page?: number; pageSize?: number } = {}
): Promise<VerificationListResult> {
  try {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(60, Math.max(1, options.pageSize ?? 24));

    const trimmed = options.q?.trim();
    const pattern = trimmed
      ? `%${trimmed.replace(/[%_]/g, "").slice(0, 80)}%`
      : null;

    const where = pattern
      ? and(
          eq(verifications.userId, userId),
          or(
            ilike(verifications.productName, pattern),
            ilike(verifications.sellerDescription, pattern)
          )
        )
      : eq(verifications.userId, userId);

    const rows = await db
      .select()
      .from(verifications)
      .where(where)
      .orderBy(desc(verifications.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const totalRows = await db
      .select({ value: count() })
      .from(verifications)
      .where(where);
    const total = totalRows[0]?.value ?? 0;

    if (total === 0 && !trimmed) {
      // Fallback to memory store if database is empty or not seeded
      return memoryStore.listVerifications(userId, options);
    }

    const items = await attachAnalysisAndThumbs(rows);
    return { items, total, page, pageSize };
  } catch (err) {
    console.warn("[db] Postgres fallback for listVerifications:", err instanceof Error ? err.message : err);
    return memoryStore.listVerifications(userId, options);
  }
}

async function attachAnalysisAndThumbs(
  rows: VerificationRow[]
): Promise<VerificationSummary[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const analysisRows = await db
    .select({
      verificationId: analyses.verificationId,
      comparisons: analyses.comparisons,
    })
    .from(analyses)
    .where(inArray(analyses.verificationId, ids));

  const imageRows = await db
    .select({
      id: images.id,
      verificationId: images.verificationId,
      createdAt: images.createdAt,
    })
    .from(images)
    .where(and(inArray(images.verificationId, ids), eq(images.kind, "product")))
    .orderBy(asc(images.createdAt));

  const analysisMap = new Map(analysisRows.map((a) => [a.verificationId, a]));
  const thumbMap = new Map<string, string>();
  for (const img of imageRows) {
    if (img.verificationId && !thumbMap.has(img.verificationId)) {
      thumbMap.set(img.verificationId, `/api/images/${img.id}`);
    }
  }

  return rows.map((v) => {
    const a = analysisMap.get(v.id);
    const comparisons = a?.comparisons ?? null;
    return {
      id: v.id,
      productName: v.productName,
      productCategory: v.productCategory,
      status: v.status as VerificationSummary["status"],
      createdAt: v.createdAt.toISOString(),
      thumbnailUrl: thumbMap.get(v.id) ?? null,
      discrepancyCount: comparisons
        ? comparisons.filter((c) => c.status === "discrepancy").length
        : null,
      supportedCount: comparisons
        ? comparisons.filter((c) => c.status === "supported").length
        : null,
      unverifiableCount: comparisons
        ? comparisons.filter((c) => c.status === "unverifiable").length
        : null,
    };
  });
}

/* ------------------------------------------------------------------ */

export interface DashboardStats {
  totals: {
    verifications: number;
    completedReports: number;
    discrepancies: number;
    claimsAssessed: number;
  };
  breakdown: { supported: number; discrepancy: number; unverifiable: number };
  activity: { date: string; count: number }[];
  recent: VerificationSummary[];
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  try {
    const rows = await db
      .select()
      .from(verifications)
      .where(eq(verifications.userId, userId))
      .orderBy(desc(verifications.createdAt))
      .limit(200);

    if (rows.length === 0) {
      return memoryStore.getDashboardStats(userId);
    }

    const analysisRows = await db
      .select({
        verificationId: analyses.verificationId,
        comparisons: analyses.comparisons,
      })
      .from(analyses)
      .innerJoin(verifications, eq(analyses.verificationId, verifications.id))
      .where(eq(verifications.userId, userId));

    const breakdown = { supported: 0, discrepancy: 0, unverifiable: 0 };
    let claimsAssessed = 0;
    for (const a of analysisRows) {
      for (const c of a.comparisons) {
        breakdown[c.status] += 1;
        claimsAssessed += 1;
      }
    }

    const activity: { date: string; count: number }[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const buckets = new Map<string, number>();
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(today.getTime() - i * dayMs);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    for (const v of rows) {
      const key = v.createdAt.toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    for (const [date, value] of buckets) activity.push({ date, count: value });

    const recent = await attachAnalysisAndThumbs(rows.slice(0, 6));

    return {
      totals: {
        verifications: rows.length,
        completedReports: analysisRows.length,
        discrepancies: breakdown.discrepancy,
        claimsAssessed,
      },
      breakdown,
      activity,
      recent,
    };
  } catch (err) {
    console.warn("[db] Postgres fallback for getDashboardStats:", err instanceof Error ? err.message : err);
    return memoryStore.getDashboardStats(userId);
  }
}
