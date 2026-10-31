// Central runtime configuration. Server-only module — never import from client code.

export const DEFAULT_GEMMA_MODEL = "gemma-4-31b-it";

// Model IDs officially exposed through the Gemini API for Gemma 4 & multimodal inspection
// (kept configurable; validated at request time against API errors).
export const KNOWN_GEMMA_MODELS = [
  "gemma-4-31b-it",
  "gemma-4-26b-a4b-it",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-3.8-flash",
] as const;

export interface AiConfigStatus {
  configured: boolean;
  model: string;
  modelRecognized: boolean;
}

export function getGemmaModel(): string {
  const raw = process.env.GEMMA_MODEL?.trim();
  return raw && raw.length > 0 ? raw : DEFAULT_GEMMA_MODEL;
}

export function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY?.trim() ?? "";
}

export function getAiConfigStatus(): AiConfigStatus {
  const model = getGemmaModel();
  return {
    configured: getGeminiApiKey().length > 0,
    model,
    modelRecognized: (KNOWN_GEMMA_MODELS as readonly string[]).includes(model),
  };
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is not configured. Set it in the environment before using authentication."
    );
  }
  return "realitycheck-dev-secret-do-not-use-in-prod";
}

export function getStorageProvider(): "db" {
  return "db";
}

export const UPLOAD_LIMITS = {
  maxFileBytes: 6 * 1024 * 1024, // 6 MB per image
  maxFilesPerRequest: 10,
  maxProductImages: 10,
  maxListingImages: 6,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
};
