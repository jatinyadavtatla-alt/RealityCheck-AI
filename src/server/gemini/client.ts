import "server-only";
import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey, getGemmaModel } from "@/server/env";

export type AiErrorCode =
  | "NOT_CONFIGURED"
  | "INVALID_KEY"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "MODEL_UNAVAILABLE"
  | "BAD_RESPONSE"
  | "UPSTREAM";

export class AiError extends Error {
  code: AiErrorCode;
  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.name = "AiError";
    this.code = code;
  }
}

export interface InlineImage {
  mimeType: string;
  data: Buffer;
}

type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type Content = { role: "user" | "model"; parts: Part[] };

const RETRYABLE: AiErrorCode[] = ["RATE_LIMITED", "TIMEOUT", "UPSTREAM"];

let cachedKey = "";
let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new AiError(
      "NOT_CONFIGURED",
      "Gemma 4 is not configured on this server. Set GEMINI_API_KEY (and optionally GEMMA_MODEL) in the environment to enable AI analysis."
    );
  }
  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new GoogleGenAI({ apiKey });
    cachedKey = apiKey;
  }
  return cachedClient;
}

function classifyError(err: unknown): AiError {
  if (err instanceof AiError) return err;
  const raw = err instanceof Error ? err.message : String(err);
  const msg = raw.toLowerCase();
  if (
    msg.includes("api_key_invalid") ||
    msg.includes("api key not valid") ||
    (msg.includes("key") && (msg.includes("invalid") || msg.includes("403")))
  ) {
    return new AiError(
      "INVALID_KEY",
      "The configured Gemini API key was rejected. Check GEMINI_API_KEY on the server."
    );
  }
  if (
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("429") ||
    msg.includes("too many requests")
  ) {
    return new AiError(
      "RATE_LIMITED",
      "The Gemma API rate limit was reached. Wait a moment, then run the analysis again."
    );
  }
  if (
    msg.includes("not found") ||
    msg.includes("not_found") ||
    msg.includes("not supported") ||
    msg.includes("no longer available") ||
    msg.includes("is not enabled")
  ) {
    return new AiError(
      "MODEL_UNAVAILABLE",
      `The model "${getGemmaModel()}" is not available through the Gemini API for this key. Set GEMMA_MODEL to an officially supported Gemma 4 identifier (for example gemma-4-31b-it).`
    );
  }
  if (msg.includes("timed out") || msg.includes("deadline")) {
    return new AiError(
      "TIMEOUT",
      "The model request timed out. The API may be busy — please try again."
    );
  }
  if (
    msg.includes("fetch failed") ||
    msg.includes("econn") ||
    msg.includes("enotfound") ||
    msg.includes("network") ||
    msg.includes("socket")
  ) {
    return new AiError(
      "UPSTREAM",
      "Could not reach the Gemini API. Check the server network connection and try again."
    );
  }
  return new AiError(
    "UPSTREAM",
    "The AI service returned an unexpected error. Please try again."
  );
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(
        new AiError(
          "TIMEOUT",
          `The model did not respond within ${Math.round(
            ms / 1000
          )} seconds. The API may be busy — please try again.`
        )
      );
    }, ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

interface CallOptions {
  maxOutputTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

async function callModel(contents: Content[], options: CallOptions): Promise<string> {
  const client = getClient();
  const primaryModel = getGemmaModel();
  const candidateModels = [
    primaryModel,
    "gemini-2.5-flash",
    "gemma-4-31b-it",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-3.8-flash",
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  let lastError: AiError | null = null;

  for (const model of candidateModels) {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await withTimeout(
          client.models.generateContent({
            model,
            contents,
            config: {
              temperature: options.temperature ?? 0.2,
              maxOutputTokens: options.maxOutputTokens ?? 4096,
            },
          }),
          options.timeoutMs ?? 60000
        );
        const text = typeof response.text === "string" ? response.text : "";
        if (!text.trim()) {
          throw new AiError("BAD_RESPONSE", "The model returned an empty response.");
        }
        return text;
      } catch (err) {
        const aiError = classifyError(err);
        console.error(`[ai-engine] ${model} (attempt ${attempt}):`, aiError.code, "-", err instanceof Error ? err.message : err);
        lastError = aiError;
        // If the model is not found, deprecated or unavailable, immediately break and try next candidate model
        if (aiError.code === "MODEL_UNAVAILABLE") {
          break;
        }
        if (!RETRYABLE.includes(aiError.code) || attempt === maxAttempts) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
      }
    }
  }
  throw lastError ?? new AiError("UPSTREAM", "The AI service failed unexpectedly.");
}

export interface GenerateOptions extends CallOptions {
  prompt: string;
  images?: InlineImage[];
}

/** Single-turn generation with optional inline images. */
export async function generateWithGemma(options: GenerateOptions): Promise<string> {
  const parts: Part[] = [{ text: options.prompt }];
  for (const img of options.images ?? []) {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.data.toString("base64") } });
  }
  return callModel([{ role: "user", parts }], options);
}

export interface ConversationTurn {
  role: "user" | "model";
  text: string;
}

export interface ChatOptions extends CallOptions {
  preamble: string;
  history: ConversationTurn[];
  message: string;
}

/** Multi-turn chat; instructions are folded into the first user turn (Gemma-safe). */
export async function generateChatWithGemma(options: ChatOptions): Promise<string> {
  const contents: Content[] = [
    { role: "user", parts: [{ text: options.preamble }] },
    {
      role: "model",
      parts: [
        {
          text: "Understood. I will answer strictly within the evidence and rules provided, clearly separating verified observations, potential discrepancies and unverifiable claims.",
        },
      ],
    },
  ];
  for (const turn of options.history) {
    contents.push({ role: turn.role, parts: [{ text: turn.text }] });
  }
  contents.push({ role: "user", parts: [{ text: options.message }] });
  return callModel(contents, options);
}
