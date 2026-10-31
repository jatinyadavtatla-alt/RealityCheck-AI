import "server-only";
import { z } from "zod";
import { AiError } from "./client";
import type {
  ClaimCategory,
  ClaimStatus,
  Completeness,
  Confidence,
  DamageType,
  Severity,
} from "@/lib/types";

const CLAIM_CATEGORIES = [
  "condition",
  "authenticity",
  "accessories",
  "functionality",
  "battery",
  "history",
  "ownership",
  "other",
] as const satisfies readonly ClaimCategory[];

const DAMAGE_TYPES = [
  "scratch",
  "dent",
  "crack",
  "screen_damage",
  "wear",
  "missing_part",
  "liquid",
  "other",
] as const satisfies readonly DamageType[];

const SEVERITIES = [
  "minor",
  "moderate",
  "significant",
] as const satisfies readonly Severity[];

const CONFIDENCES = ["low", "medium", "high"] as const satisfies readonly Confidence[];
const STATUSES = ["supported", "discrepancy", "unverifiable"] as const satisfies readonly ClaimStatus[];
const COMPLETENESS_LEVELS = ["low", "medium", "high"] as const satisfies readonly Completeness[];

/* ---------- Lenient scalar helpers (the model is politely unreliable) ---------- */

const toStr = (fallback: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback),
    z.string()
  );

const toStrOrNull = z.preprocess(
  (v) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : null),
  z.string().nullable()
);

const toStrArr = z.preprocess(
  (v) =>
    Array.isArray(v)
      ? v
          .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
          .map((x) => x.trim())
      : [],
  z.array(z.string())
);

function enumOr<T extends string>(values: readonly T[], fallback: T) {
  return z.preprocess(
    (v) =>
      typeof v === "string" && (values as readonly string[]).includes(v.toLowerCase())
        ? (v.toLowerCase() as T)
        : fallback,
    z.enum(values as unknown as [T, ...T[]])
  );
}

function enumOrNull<T extends string>(values: readonly T[]) {
  return z.preprocess(
    (v) =>
      typeof v === "string" && (values as readonly string[]).includes(v.toLowerCase())
        ? (v.toLowerCase() as T)
        : null,
    z.enum(values as unknown as [T, ...T[]]).nullable()
  );
}

const toArr = <S extends z.ZodTypeAny>(item: S) =>
  z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(item));

/* ---------- Stage output schemas ---------- */

export const claimsStageSchema = z.object({
  claims: toArr(
    z.object({
      id: toStr(""),
      claim: toStr(""),
      quote: toStr(""),
      category: enumOr(CLAIM_CATEGORIES, "other"),
    })
  ),
});

export const visionStageSchema = z.object({
  productOverview: z.preprocess(
    (v) => (typeof v === "object" && v !== null ? v : {}),
    z.object({
      detectedProductType: toStr("the listed product"),
      brand: toStrOrNull,
      model: toStrOrNull,
      visibleIdentifiers: toStrArr,
      summary: toStr(""),
      uncertaintyNotes: toStrOrNull,
    })
  ),
  observations: toArr(
    z.object({
      id: toStr(""),
      imageRef: toStr(""),
      observation: toStr(""),
      damageType: enumOrNull(DAMAGE_TYPES),
      severity: enumOrNull(SEVERITIES),
      location: toStrOrNull,
    })
  ),
});

export const comparisonStageSchema = z.object({
  comparisons: toArr(
    z.object({
      claimId: toStr(""),
      claim: toStr(""),
      status: enumOr(STATUSES, "unverifiable"),
      explanation: toStr(""),
      confidence: enumOr(CONFIDENCES, "low"),
      limitations: toStrOrNull,
      observationIds: toStrArr,
      imageRefs: toStrArr,
    })
  ),
});

export const reportStageSchema = z.object({
  headline: toStr("Evidence review complete"),
  summary: toStr(""),
  evidenceCompleteness: enumOr(COMPLETENESS_LEVELS, "medium"),
  evidenceGaps: toStrArr,
  buyerGuidance: toStrArr,
  caveats: toStrArr,
  followUpQuestions: toArr(
    z.object({
      question: toStr(""),
      why: toStr(""),
    })
  ),
});

/* ---------- JSON extraction ---------- */

export function extractJsonObject(raw: string): unknown {
  let text = raw.trim();
  const fence = text.match(/```[a-zA-Z]*([\s\S]*?)```/);
  if (fence && fence[1]) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new AiError(
      "BAD_RESPONSE",
      "The model did not return structured JSON. Please try running the analysis again."
    );
  }
  try {
    return JSON.parse(text.slice(start, end + 1)) as unknown;
  } catch {
    throw new AiError(
      "BAD_RESPONSE",
      "The model returned malformed JSON. Please try running the analysis again."
    );
  }
}

export function parseStage<S extends z.ZodTypeAny>(
  raw: string,
  schema: S,
  stageName: string
): z.infer<S> {
  const parsed = schema.safeParse(extractJsonObject(raw));
  if (!parsed.success) {
    throw new AiError(
      "BAD_RESPONSE",
      `Could not interpret the model's ${stageName} output. Please try running the analysis again.`
    );
  }
  return parsed.data as z.infer<S>;
}
