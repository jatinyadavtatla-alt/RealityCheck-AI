import { jsonOk, requireUser } from "@/server/http";
import { getAiConfigStatus, KNOWN_GEMMA_MODELS } from "@/server/env";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const status = getAiConfigStatus();
  return jsonOk({
    ai: {
      configured: status.configured,
      model: status.model,
      modelRecognized: status.modelRecognized,
      knownModels: KNOWN_GEMMA_MODELS,
    },
    storage: { provider: "database", imagesPrivate: true },
  });
}
