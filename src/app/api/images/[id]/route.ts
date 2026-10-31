import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { images } from "@/db/schema";
import { jsonError, jsonOk, requireUser } from "@/server/http";
import { memoryStore } from "@/server/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  try {
    const rows = await db
      .select({
        mimeType: images.mimeType,
        fileName: images.fileName,
        data: images.data,
      })
      .from(images)
      .where(and(eq(images.id, id), eq(images.userId, auth.user.id)))
      .limit(1);

    const image = rows[0];
    if (image) {
      return new Response(new Uint8Array(image.data), {
        headers: {
          "Content-Type": image.mimeType,
          "Content-Length": String(image.data.length),
          "Cache-Control": "private, max-age=3600",
          "Content-Disposition": `inline; filename="${encodeURIComponent(
            image.fileName
          )}"`,
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  } catch {
    // fallback to memoryStore
  }

  const memImage = await memoryStore.getImage(id);
  if (!memImage) {
    return jsonError(404, "Image not found.", "NOT_FOUND");
  }

  return new Response(new Uint8Array(memImage.data), {
    headers: {
      "Content-Type": memImage.mimeType,
      "Content-Length": String(memImage.data.length),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${encodeURIComponent(
        memImage.fileName
      )}"`,
      "X-Content-Type-Options": "nosniff",
    },
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
      .delete(images)
      .where(and(eq(images.id, id), eq(images.userId, auth.user.id)))
      .returning({ id: images.id });

    if (deleted.length > 0) {
      return jsonOk({ ok: true });
    }
  } catch {
    // fallback to memoryStore
  }

  return jsonOk({ ok: true });
}
