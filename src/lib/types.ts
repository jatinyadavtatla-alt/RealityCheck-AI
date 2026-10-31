// Shared types between server pipeline, API routes and client UI.

export type VerificationStatus = "draft" | "analyzing" | "completed" | "failed";
export type ClaimStatus = "supported" | "discrepancy" | "unverifiable";
export type Confidence = "low" | "medium" | "high";
export type Completeness = "low" | "medium" | "high";
export type ClaimCategory =
  | "condition"
  | "authenticity"
  | "accessories"
  | "functionality"
  | "battery"
  | "history"
  | "ownership"
  | "other";
export type DamageType =
  | "scratch"
  | "dent"
  | "crack"
  | "screen_damage"
  | "wear"
  | "missing_part"
  | "liquid"
  | "other";
export type Severity = "minor" | "moderate" | "significant";

export interface ExtractedClaim {
  id: string;
  claim: string;
  quote: string;
  category: ClaimCategory;
}

export interface VisualObservation {
  id: string;
  imageRef: string;
  observation: string;
  damageType: DamageType | null;
  severity: Severity | null;
  location: string | null;
}

export interface ClaimComparison {
  claimId: string;
  claim: string;
  quote?: string;
  category?: ClaimCategory;
  status: ClaimStatus;
  explanation: string;
  confidence: Confidence;
  limitations: string | null;
  observationIds: string[];
  imageRefs: string[];
}

export interface UnverifiableClaim {
  claim: string;
  reason: string;
  howToVerify: string;
}

export interface FollowUpQuestion {
  question: string;
  why: string;
}

export interface ProductOverview {
  detectedProductType: string;
  brand: string | null;
  model: string | null;
  visibleIdentifiers: string[];
  summary: string;
  uncertaintyNotes: string | null;
}

export interface OverallAssessment {
  headline: string;
  summary: string;
  supportedCount: number;
  discrepancyCount: number;
  unverifiableCount: number;
  evidenceCompleteness: Completeness;
  evidenceGaps: string[];
  buyerGuidance: string[];
  caveats: string[];
}

export interface AnalysisResult {
  productOverview: ProductOverview;
  extractedClaims: ExtractedClaim[];
  visualObservations: VisualObservation[];
  comparisons: ClaimComparison[];
  discrepancies: ClaimComparison[];
  unverifiableClaims: UnverifiableClaim[];
  followUpQuestions: FollowUpQuestion[];
  overallAssessment: OverallAssessment;
}

export interface ImageMeta {
  id: string;
  kind: "listing" | "product";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  ref?: string;
}

export interface VerificationSummary {
  id: string;
  productName: string;
  productCategory: string;
  status: VerificationStatus;
  createdAt: string;
  thumbnailUrl: string | null;
  discrepancyCount: number | null;
  supportedCount: number | null;
  unverifiableCount: number | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export type AnalysisStage = "claims" | "images" | "damage" | "compare" | "report";

export type AnalysisEvent =
  | { type: "stage"; stage: AnalysisStage; state: "active" | "done"; detail?: string }
  | { type: "complete"; verificationId: string; durationMs: number }
  | { type: "error"; message: string; stage?: AnalysisStage; code?: string };

export const PRODUCT_CATEGORIES: { value: string; label: string }[] = [
  { value: "smartphone", label: "Smartphone" },
  { value: "laptop", label: "Laptop" },
  { value: "tablet", label: "Tablet" },
  { value: "smartwatch", label: "Smartwatch" },
  { value: "camera", label: "Camera" },
  { value: "audio", label: "Headphones / Audio" },
  { value: "console", label: "Game console" },
  { value: "other_electronics", label: "Other electronics" },
  { value: "other", label: "Other product" },
];

export const CLAIM_STATUS_META: Record<
  ClaimStatus,
  { label: string; tone: "success" | "danger" | "warning" }
> = {
  supported: { label: "Supported by visible evidence", tone: "success" },
  discrepancy: { label: "Potential discrepancy", tone: "danger" },
  unverifiable: { label: "Cannot be verified", tone: "warning" },
};

export const CONFIDENCE_META: Record<Confidence, { label: string; pct: number }> = {
  low: { label: "Low confidence", pct: 34 },
  medium: { label: "Medium confidence", pct: 67 },
  high: { label: "High confidence", pct: 100 },
};

export const COMPLETENESS_META: Record<Completeness, { label: string }> = {
  low: { label: "Limited evidence" },
  medium: { label: "Partial evidence" },
  high: { label: "Strong evidence" },
};

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  scratch: "Scratch",
  dent: "Dent",
  crack: "Crack",
  screen_damage: "Screen damage",
  wear: "Cosmetic wear",
  missing_part: "Missing part / accessory",
  liquid: "Possible liquid damage",
  other: "Other",
};
