import "server-only";
import {
  PRODUCT_CATEGORIES,
  type AnalysisEvent,
  type AnalysisResult,
  type ClaimCategory,
  type ClaimComparison,
  type ExtractedClaim,
  type FollowUpQuestion,
  type OverallAssessment,
  type UnverifiableClaim,
  type VisualObservation,
} from "@/lib/types";
import type { AnalysisRow, VerificationRow } from "@/db/schema";
import {
  generateChatWithGemma,
  generateWithGemma,
  type ConversationTurn,
  type InlineImage,
} from "./client";
import {
  buildAssistantPreamble,
  buildClaimExtractionPrompt,
  buildComparisonPrompt,
  buildReportPrompt,
  buildVisionPrompt,
} from "./prompts";
import {
  claimsStageSchema,
  comparisonStageSchema,
  parseStage,
  reportStageSchema,
  visionStageSchema,
} from "./parse";

export interface TaggedImage extends InlineImage {
  ref: string;
  id: string;
  kind: "listing" | "product";
  fileName: string;
}

export type EmitFn = (event: AnalysisEvent) => void;

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function categoryLabel(value: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function normalizeRef(ref: string, validRefs: string[]): string {
  const up = ref.trim().toUpperCase();
  if (validRefs.includes(up)) return up;
  const sorted = [...validRefs].sort((a, b) => b.length - a.length);
  for (const candidate of sorted) {
    if (up.includes(candidate)) return candidate;
  }
  return "";
}

const HOW_TO_VERIFY: Record<ClaimCategory, string> = {
  condition:
    "Ask for close-up photos of every side, the screen powered on, and the ports, taken in good light.",
  authenticity:
    "Ask for photos of serial numbers / IMEI and verify them with the manufacturer or official checker.",
  accessories:
    "Ask for one photo showing every included accessory laid out together.",
  functionality:
    "Ask for a short video demonstrating the claimed function working on this exact unit.",
  battery:
    "Ask for a screenshot of the system's battery health / cycle count screen.",
  history:
    "Ask for the original purchase receipt or service documentation.",
  ownership:
    "Ask for proof of purchase and confirm the device is not locked to another account.",
  other: "Ask the seller for targeted evidence that could demonstrate this claim.",
};

const BASE_CAVEATS = [
  "Photographs alone cannot prove authenticity, internal condition or repair history.",
  "This report reviews only visible evidence; hidden defects may exist and should be checked in person.",
];

export interface PipelineResult {
  result: AnalysisResult;
  durationMs: number;
}

export async function runAnalysisPipeline(args: {
  verification: VerificationRow;
  listingImages: TaggedImage[];
  productImages: TaggedImage[];
  emit: EmitFn;
}): Promise<PipelineResult> {
  const { verification, listingImages, productImages, emit } = args;
  const startedAt = Date.now();
  const label = categoryLabel(verification.productCategory);
  const productRefs = productImages.map((i) => i.ref);
  const allRefs = [...productRefs, ...listingImages.map((i) => i.ref)];

  /* ---- Stage 1: claim extraction (text + optional listing screenshots) ---- */
  emit({ type: "stage", stage: "claims", state: "active" });
  const claimsPromise = (async () => {
    const raw = await generateWithGemma({
      prompt: buildClaimExtractionPrompt({
        productName: verification.productName,
        categoryLabel: label,
        description: verification.sellerDescription,
        additionalDetails: verification.additionalDetails ?? "",
        listingRefs: listingImages.map((i) => i.ref),
      }),
      images: listingImages,
      maxOutputTokens: 2048,
      temperature: 0.1,
      timeoutMs: 90000,
    });
    const claims = parseStage(raw, claimsStageSchema, "claim extraction").claims
      .filter((c) => c.claim.length > 1)
      .slice(0, 24)
      .map<ExtractedClaim>((c, i) => ({
        id: `c${i + 1}`,
        claim: c.claim,
        quote: c.quote,
        category: c.category,
      }));
    emit({
      type: "stage",
      stage: "claims",
      state: "done",
      detail:
        claims.length === 0
          ? "No checkable claims found in the listing"
          : `${plural(claims.length, "claim")} identified`,
    });
    return claims;
  })();

  /* ---- Stage 2+3: image understanding + damage identification ---- */
  emit({ type: "stage", stage: "images", state: "active" });
  const visionPromise = (async () => {
    const raw = await generateWithGemma({
      prompt: buildVisionPrompt({
        productName: verification.productName,
        categoryLabel: label,
        productRefs,
      }),
      images: productImages,
      maxOutputTokens: 4096,
      temperature: 0.1,
      timeoutMs: 150000,
    });
    const vision = parseStage(raw, visionStageSchema, "image analysis");
    const observations: VisualObservation[] = vision.observations
      .filter((o) => o.observation.length > 1)
      .slice(0, 40)
      .map((o, i) => ({
        id: `o${i + 1}`,
        imageRef: normalizeRef(o.imageRef, productRefs),
        observation: o.observation,
        damageType: o.damageType,
        severity: o.severity,
        location: o.location,
      }));
    emit({
      type: "stage",
      stage: "images",
      state: "done",
      detail: `${plural(productImages.length, "photo")} examined`,
    });
    emit({ type: "stage", stage: "damage", state: "active" });
    const damageCount = observations.filter((o) => o.damageType !== null).length;
    emit({
      type: "stage",
      stage: "damage",
      state: "done",
      detail:
        damageCount === 0
          ? "No visible surface damage identified"
          : `${plural(damageCount, "visible finding")} recorded`,
    });
    return { overview: vision.productOverview, observations };
  })();

  const [claims, vision] = await Promise.all([claimsPromise, visionPromise]);

  /* ---- Stage 4: evidence comparison ---- */
  emit({ type: "stage", stage: "compare", state: "active" });
  const comparisonsRaw = parseStage(
    await generateWithGemma({
      prompt: buildComparisonPrompt({
        productName: verification.productName,
        claimsJson: JSON.stringify(claims),
        observationsJson: JSON.stringify(vision.observations),
      }),
      maxOutputTokens: 4096,
      temperature: 0.1,
      timeoutMs: 90000,
    }),
    comparisonStageSchema,
    "evidence comparison"
  ).comparisons;

  const claimById = new Map(claims.map((c) => [c.id, c]));
  const obsIds = new Set(vision.observations.map((o) => o.id));

  let comparisons: ClaimComparison[] = comparisonsRaw.map((c, i) => {
    const matched =
      claimById.get(c.claimId) ??
      claims.find((cl) => cl.claim.toLowerCase() === c.claim.toLowerCase()) ??
      claims[i];
    return {
      claimId: matched?.id ?? c.claimId ?? `c${i + 1}`,
      claim: matched?.claim ?? c.claim,
      quote: matched?.quote,
      category: matched?.category,
      status: c.status,
      explanation: c.explanation || "No explanation was returned for this comparison.",
      confidence: c.confidence,
      limitations: c.limitations,
      observationIds: c.observationIds.filter((id) => obsIds.has(id)),
      imageRefs: c.imageRefs
        .map((r) => normalizeRef(r, allRefs))
        .filter((r) => r.length > 0),
    };
  });

  // Guarantee every extracted claim is covered exactly once.
  const covered = new Set(comparisons.map((c) => c.claimId));
  for (const claim of claims) {
    if (!covered.has(claim.id)) {
      comparisons.push({
        claimId: claim.id,
        claim: claim.claim,
        quote: claim.quote,
        category: claim.category,
        status: "unverifiable",
        explanation:
          "This claim could not be assessed against the provided photographs.",
        confidence: "low",
        limitations: "Automated comparison coverage was incomplete for this claim.",
        observationIds: [],
        imageRefs: [],
      });
    }
  }
  comparisons = comparisons.slice(0, Math.max(claims.length, 1));

  const discrepancyCount = comparisons.filter(
    (c) => c.status === "discrepancy"
  ).length;
  emit({
    type: "stage",
    stage: "compare",
    state: "done",
    detail:
      discrepancyCount === 0
        ? "No claim contradicts the visible evidence"
        : `${plural(discrepancyCount, "potential discrepancy")} detected`,
  });

  /* ---- Stage 5: report synthesis ---- */
  emit({ type: "stage", stage: "report", state: "active" });
  const counts = {
    supported: comparisons.filter((c) => c.status === "supported").length,
    discrepancy: discrepancyCount,
    unverifiable: comparisons.filter((c) => c.status === "unverifiable").length,
  };
  const report = parseStage(
    await generateWithGemma({
      prompt: buildReportPrompt({
        productName: verification.productName,
        countsJson: JSON.stringify(counts),
        comparisonsJson: JSON.stringify(
          comparisons.map((c) => ({
            claim: c.claim,
            status: c.status,
            confidence: c.confidence,
            explanation: c.explanation,
            limitations: c.limitations,
          }))
        ),
      }),
      maxOutputTokens: 4096,
      temperature: 0.2,
      timeoutMs: 90000,
    }),
    reportStageSchema,
    "report generation"
  );
  emit({ type: "stage", stage: "report", state: "done", detail: "Report ready" });

  const unverifiableClaims: UnverifiableClaim[] = comparisons
    .filter((c) => c.status === "unverifiable")
    .map((c) => ({
      claim: c.claim,
      reason:
        c.limitations ??
        "None of the provided photographs show evidence for this claim.",
      howToVerify: HOW_TO_VERIFY[c.category ?? "other"],
    }));

  const followUpQuestions: FollowUpQuestion[] = report.followUpQuestions
    .filter((q) => q.question.length > 3)
    .slice(0, 8);

  const caveats = [...report.caveats];
  for (const base of BASE_CAVEATS) {
    if (!caveats.some((c) => c.toLowerCase() === base.toLowerCase())) {
      caveats.push(base);
    }
  }

  const overallAssessment: OverallAssessment = {
    headline: report.headline,
    summary: report.summary,
    supportedCount: counts.supported,
    discrepancyCount: counts.discrepancy,
    unverifiableCount: counts.unverifiable,
    evidenceCompleteness: report.evidenceCompleteness,
    evidenceGaps: report.evidenceGaps.slice(0, 8),
    buyerGuidance: report.buyerGuidance.slice(0, 6),
    caveats: caveats.slice(0, 6),
  };

  return {
    result: {
      productOverview: vision.overview,
      extractedClaims: claims,
      visualObservations: vision.observations,
      comparisons,
      discrepancies: comparisons.filter((c) => c.status === "discrepancy"),
      unverifiableClaims,
      followUpQuestions,
      overallAssessment,
    },
    durationMs: Date.now() - startedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Buyer assistant                                                     */
/* ------------------------------------------------------------------ */

export async function runAssistantReply(args: {
  verification: VerificationRow;
  analysis: AnalysisRow;
  history: { role: "user" | "assistant"; content: string }[];
  message: string;
}): Promise<string> {
  const { verification, analysis, history, message } = args;

  const analysisContext = {
    productOverview: analysis.productOverview,
    comparisons: analysis.comparisons.map((c) => ({
      claim: c.claim,
      status: c.status,
      explanation: c.explanation,
      confidence: c.confidence,
      limitations: c.limitations,
    })),
    unverifiableClaims: analysis.unverifiableClaims,
    followUpQuestions: analysis.followUpQuestions,
    overallAssessment: analysis.overallAssessment,
  };

  const turns: ConversationTurn[] = history.slice(-12).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    text: m.content.slice(0, 1500),
  }));

  const reply = await generateChatWithGemma({
    preamble: buildAssistantPreamble({
      productName: verification.productName,
      categoryLabel: categoryLabel(verification.productCategory),
      description: verification.sellerDescription.slice(0, 1500),
      analysisJson: JSON.stringify(analysisContext),
    }),
    history: turns,
    message,
    temperature: 0.35,
    maxOutputTokens: 900,
    timeoutMs: 45000,
  });

  return reply.trim();
}
