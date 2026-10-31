import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { images } from "@/db/schema";
import { jsonError, jsonOk, requireUser, sanitizeText } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { UPLOAD_LIMITS } from "@/server/env";
import type { ImageMeta } from "@/lib/types";
import { memoryStore } from "@/server/store";

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const rl = rateLimit(`uploads:${user.id}`, 120, 60 * 60 * 1000);
  if (!rl.ok) {
    return jsonError(
      429,
      "Upload limit reached. Please try again later.",
      "RATE_LIMITED"
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError(400, "Expected multipart form data.", "BAD_FORM");
  }

  const kindRaw = form.get("kind");
  const kind: "listing" | "product" = kindRaw === "listing" ? "listing" : "product";
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return jsonError(400, "No image files were provided.", "NO_FILES");
  }
  if (files.length > UPLOAD_LIMITS.maxFilesPerRequest) {
    return jsonError(
      400,
      `Too many files at once (max ${UPLOAD_LIMITS.maxFilesPerRequest}).`,
      "TOO_MANY"
    );
  }

  const allowed = UPLOAD_LIMITS.allowedMimeTypes as readonly string[];
  for (const file of files) {
    if (!allowed.includes(file.type as any) && !file.type.startsWith("image/")) {
      return jsonError(
        400,
        `"${file.name}" is not a supported image. Use JPEG, PNG or WebP.`,
        "BAD_TYPE"
      );
    }
    if (file.size === 0) {
      return jsonError(400, `"${file.name}" is an empty file.`, "EMPTY_FILE");
    }
    if (file.size > UPLOAD_LIMITS.maxFileBytes) {
      return jsonError(
        400,
        `"${file.name}" is larger than ${Math.round(
          UPLOAD_LIMITS.maxFileBytes / (1024 * 1024)
        )} MB.`,
        "TOO_LARGE"
      );
    }
  }

  const saved: ImageMeta[] = [];
  for (const file of files) {
    const data = Buffer.from(await file.arrayBuffer());
    const fileName = sanitizeText(file.name).slice(0, 180) || "image";

    try {
      const inserted = await db
        .insert(images)
        .values({
          userId: user.id,
          kind,
          fileName,
          mimeType: file.type || "image/jpeg",
          sizeBytes: file.size,
          data,
        })
        .returning({ id: images.id });
      const id = inserted[0].id;
      saved.push({
        id,
        kind,
        fileName,
        mimeType: file.type || "image/jpeg",
        sizeBytes: file.size,
        url: `/api/images/${id}`,
      });
    } catch {
      // Fallback: save to memoryStore
      const fallbackId = randomUUID();
      await memoryStore.saveImage({
        id: fallbackId,
        userId: user.id,
        verificationId: null,
        kind,
        fileName,
        mimeType: file.type || "image/jpeg",
        sizeBytes: file.size,
        data,
        createdAt: new Date(),
      });
      saved.push({
        id: fallbackId,
        kind,
        fileName,
        mimeType: file.type || "image/jpeg",
        sizeBytes: file.size,
        url: `/api/images/${fallbackId}`,
      });
    }
  }

  return jsonOk({ images: saved }, { status: 201 });
}
